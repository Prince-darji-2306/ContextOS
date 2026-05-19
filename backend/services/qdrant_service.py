from uuid import uuid4
from fastapi import HTTPException
from datetime import datetime, timezone, timedelta
from repos import get_qdrant_client , get_embedding 
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue, PointIdsList, Increment
from schemas import WriteMemoryRequest, RecallMemoryRequest, SearchMemoryRequest


async def create_memory(user_id: str , req : WriteMemoryRequest):
    try:
        client = await get_qdrant_client()
        partial_results = await check_duplicates(req.text, user_id)
        
        if partial_results["is_duplicate"]:
            return partial_results

        embedding = partial_results["query_embedding"]
            
        memory = {
            "user_id": user_id,
            "app_id": req.app_id,
            "content": req.text,
            "tags": req.tags,
            "memory_type": req.memory_type,
            "importance" : 0.5,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_accessed": datetime.now(timezone.utc).isoformat(),
            "agent_id" : None,
            "access_count" : 0,
            "ttl": (datetime.now(timezone.utc) + timedelta(days=req.ttl)).isoformat() if req.ttl is not None else None,
        }

        client.upsert(
            collection_name="memories",
            points=[PointStruct(id=str(uuid4()), vector=embedding, payload=memory)],
        )
        return {"is_duplicate" : False , "message" : "Memory written successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

async def recall_memory(user_id : str , req : RecallMemoryRequest, embedding:bool = False):
    try:
        client = await get_qdrant_client()
        query_embedding = await get_embedding(req.query)
        
        filter_query = Filter(must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id))
        ])
        
        results = client.query_points(
            collection_name="memories",
            query=query_embedding,
            limit=req.top_k,
            filter=filter_query,
            with_payload=True,
            with_vectors=False,
        )

        if embedding:
            return results, query_embedding
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def search_memory(user_id : str , req : SearchMemoryRequest):
    try:
        client = await get_qdrant_client()

        must_conditions = [
            FieldCondition(key="user_id", match=MatchValue(value=user_id))
        ]
        
        if req.filters:
            for key, value in req.filters.items():
                must_conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )
        
        filter_query = Filter(must=must_conditions)
        

        results = client.scroll(
            collection_name="memories",
            filter=filter_query,
            with_payload=True,
            with_vectors=False,
            limit=req.limit,
            offset=req.offset,
        )

        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def check_duplicates(query: str, user_id: str, threshold = 0.85):
    try:
        results, query_embedding = await recall_memory(user_id,RecallMemoryRequest(query=query, top_k=1), embedding=True)
        if results.points:
            memory = results.points[0]
            if memory.score >= threshold:
                return {
                    "is_duplicate": True,
                    "existing_memory_id": memory.id,
                    "similarity_score": memory.score,
                    "existing_content_preview": memory.payload["content"],
                }

        return {"is_duplicate": False, "query_embedding": query_embedding}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def forget_memories(memory_ids : list[str]):
    try:
        client = await get_qdrant_client()

        if not memory_ids:
            raise HTTPException(
                status_code=400,
                detail="memory_ids required"
            )

        client.delete(
            collection_name="memories",
            points_selector=PointIdsList(points = memory_ids)
        )

        return {"message" : "Memories deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def update_access_stats(memory_ids: list[str]):
    try:
        client = await get_qdrant_client()
        
        client.set_payload(
            collection_name="memories",
            payload={
                "last_accessed": datetime.now(timezone.utc).isoformat(),
                "access_count": Increment(points=memory_ids, amount=1)
            },
            points=memory_ids   
        )
        return {"message" : "Access stats updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------Importance Scoring------------
def score_memory(similarity: float, created_at: str) -> float:
    created = datetime.fromisoformat(created_at)
    days_old = (datetime.now(timezone.utc) - created).days
    recency_score = 1 / (1 + days_old)
    return (0.7 * similarity) + (0.3 * recency_score)
