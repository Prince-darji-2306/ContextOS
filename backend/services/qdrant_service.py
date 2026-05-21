from uuid import uuid4
from math import log1p
from fastapi import HTTPException
from datetime import datetime, timezone, timedelta
from repos import get_qdrant_client , get_embedding 
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue, PointIdsList, UpdateOperation, SetPayloadOperation
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


# ------------Importance Scoring------------
async def score_memory(similarity: float, created_at: str, access_count: int) -> float:
    created = datetime.fromisoformat(created_at)
    days_old = (datetime.now(timezone.utc) - created).days
    recency_score = 1 / (1 + days_old)
    access_score = log1p(access_count) / 10
    return (0.6 * similarity) + (0.25 * recency_score) + (0.15 * access_score)

async def batch_update_scores_and_stats(points: list):
    """
    Computes custom scores for each point individually and updates their payloads 
    in a single database round-trip.
    """
    try:
        client = await get_qdrant_client()

        operations = []
        for point in points:
            similarity = point.score 
            created_at = point.payload.get("created_at")
            current_count = point.payload.get("access_count", 0)
            
            importance_score = await score_memory(similarity, created_at, current_count)
            
            operations.append(
                UpdateOperation.SetPayload(
                    set_payload=SetPayloadOperation(
                        points=[point.id],
                        payload={
                            "importance": importance_score,
                            "last_accessed": datetime.now(timezone.utc).isoformat(),
                            "access_count": current_count + 1
                        }
                    )
                )
            )

        if operations:
            client.batch_update_points(
                collection_name="memories",
                operations=operations
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))