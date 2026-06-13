from asyncio import create_task
from core import get_current_user, pairwise_cosine_similarity
from repos import fetch_pending_conflicts, resolve_memory_conflict
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from schemas import WriteMemoryRequest, RecallMemoryRequest, SearchMemoryRequest, ConflitMemoryRequest
from services import create_memory, recall_memory, search_memory, batch_update_scores_and_stats, forget_memories

router = APIRouter(prefix='/memories', tags=['memories'])


@router.post('/write')
async def write_user_memories(req : WriteMemoryRequest, user_id: str = Depends(get_current_user)):
    return await create_memory(user_id, req)


@router.post('/recall')
async def recall_user_memories(req : RecallMemoryRequest, bgtasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    result = await recall_memory(user_id, req)
    bgtasks.add_task(batch_update_scores_and_stats, result.points)
    return result


@router.post('/search')
async def search_user_memories(req : SearchMemoryRequest, user_id: str = Depends(get_current_user)):
    return await search_memory(user_id, req)


@router.delete('/forget')
async def forget_user_memories(memory_ids : list[str] = Query(...), user_id: str = Depends(get_current_user)):
    return await forget_memories(memory_ids)

@router.get('/conflicts')
async def get_pending_conflicts(user_id: str = Depends(get_current_user)):
    return await fetch_pending_conflicts(user_id)


@router.put('/resolve-conflict')
async def resolve_conflict(req: ConflitMemoryRequest, user_id: str = Depends(get_current_user)):
    await resolve_memory_conflict(req.conflict_id, user_id, req.action)
    if req.action == 'forget':
        create_task(forget_memories([req.memory_id]))
    return {"message": "Conflict resolved successfully"}


@router.get('/graph')
async def get_memory_graph(threshold: float = 0.65, user_id: str = Depends(get_current_user)):
    # 1. Fetch all user memories with their vectors (limit to a high number)
    results = await search_memory(user_id, SearchMemoryRequest(limit=5000), with_vectors=True)
    points = results[0]

    nodes = []
    for p in points:
        nodes.append({
            "id": p.id,
            "payload": p.payload
        })

    edges = []
    if len(points) >= 2:
        import numpy as np
        X = np.array([p.vector for p in points])
        S = pairwise_cosine_similarity(X)

        # Extract upper triangle indices (excluding diagonal) to prevent duplicate edges
        ii, jj = np.triu_indices(len(points), k=1)
        # Boolean mask for similarities matching the threshold
        mask = S[ii, jj] >= threshold
        
        # Populate edges list using vectorized results
        for i, j, score in zip(ii[mask], jj[mask], S[ii, jj][mask]):
            edges.append({
                "source": points[int(i)].id,
                "target": points[int(j)].id,
                "weight": float(score)
            })

    return {"nodes": nodes, "edges": edges}
