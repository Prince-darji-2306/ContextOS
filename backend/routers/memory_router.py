from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from core import get_current_user
from services import create_memory, recall_memory, search_memory, batch_update_scores_and_stats, forget_memories
from schemas import WriteMemoryRequest, RecallMemoryRequest, SearchMemoryRequest

router = APIRouter(prefix='/memories', tags=['memories'])


@router.post('/write')
async def write_user_memories(req : WriteMemoryRequest, user_id: str = Depends(get_current_user)):
    try:
        return await create_memory(user_id, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/recall')
async def recall_user_memories(req : RecallMemoryRequest, bgtasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    try:
        result = await recall_memory(user_id, req)
        bgtasks.add_task(batch_update_scores_and_stats, result.points)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/search')
async def search_user_memories(req : SearchMemoryRequest, user_id: str = Depends(get_current_user)):
    try:
        return await search_memory(user_id, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/forget')
async def forget_user_memories(memory_ids : list[str], user_id: str = Depends(get_current_user)):
    try:
        return await forget_memories(memory_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))