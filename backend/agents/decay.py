from schemas import SearchMemoryRequest
from datetime import datetime, timezone, timedelta
from repos import get_qdrant_client, insert_agent_log
from services import get_expired_memories_id, forget_memories, search_memory
from qdrant_client.models import SetPayloadOperation, SetPayload

async def run_decay_agent(user_id: str) -> list[str]:
    expired_ids = await get_expired_memories_id(user_id)
    
    if expired_ids:
        await forget_memories(expired_ids)
        await insert_agent_log("decay_agent", user_id, "deleted_expired_ttl", expired_ids, "success")

    # Demote stale memories (>90 days old, unaccessed or low importance)
    user_points = await search_memory(user_id, SearchMemoryRequest(limit=10000))
    
    ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
    demote_ids = []
    operations = []
    
    for p in user_points:
        last_acc_str = p.payload.get("last_accessed") or p.payload.get("created_at")
        last_acc = datetime.fromisoformat(last_acc_str)
        if last_acc < ninety_days_ago and p.payload.get("importance") > 0.1:
            demote_ids.append(p.id)
            operations.append(
                SetPayloadOperation(
                    set_payload=SetPayload(points=[p.id], payload={"importance": 0.1})
                )
            )
            
    if operations:
        client = await get_qdrant_client()
        client.batch_update_points(collection_name="memories", update_operations=operations)
        await insert_agent_log("decay_agent", user_id, "demoted_stale_memories", demote_ids, "success")
        
    return expired_ids + demote_ids
