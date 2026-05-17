from uuid import uuid4
from fastapi import HTTPException
from datetime import datetime, timezone, timedelta
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
from repos import get_qdrant_client , get_embedding 
from schemas import WriteMemoryRequest, RecallMemoryRequest, SearchMemoryRequest

async def create_memory(user_id: str , req : WriteMemoryRequest):
    try:
        client = await get_qdrant_client()
        embedding = await get_embedding(req.text)
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
        return {"message" : "Memory written successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

async def recall_memory(user_id : str , req : RecallMemoryRequest):
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
