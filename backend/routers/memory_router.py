from fastapi import APIRouter, Depends, HTTPException
from core import get_current_user
from services import create_memory, recall_memory, search_memory
from schemas import WriteMemoryRequest, RecallMemoryRequest, SearchMemoryRequest

router = APIRouter(prefix='/memories', tags=['memories'])

@router.post('/write')
async def write_user_memories(req : WriteMemoryRequest, user_id: str = Depends(get_current_user)):
    try:
        return await create_memory(user_id, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/recall')
async def recall_user_memories(req : RecallMemoryRequest, user_id: str = Depends(get_current_user)):
    try:
        return await recall_memory(user_id, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/search')
async def search_user_memories(req : SearchMemoryRequest, user_id: str = Depends(get_current_user)):
    try:
        return await search_memory(user_id, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
