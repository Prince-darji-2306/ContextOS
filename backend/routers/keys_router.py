from core import get_current_user , create_user_api_key
from repos import get_user_api_keys, remove_user_api_key
from schemas import GenerateAPIKeyRequest
from fastapi import APIRouter, Depends, HTTPException


router = APIRouter(prefix="/api-key" , tags=["API Keys"])

@router.post("/new")
async def generate_api_key(req : GenerateAPIKeyRequest , user_id : str = Depends(get_current_user)):
    try:
        key = await create_user_api_key(user_id, req.app_id, req.app_name, req.ttl_days)
        return {
            "key": key,
            "user_id": user_id,
            "app_id": req.app_id,
            "app_name": req.app_name,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/list')
async def get_user_api_keys(user_id : str = Depends(get_current_user)):
    try:
        keys = await get_user_api_keys(user_id)
        return {
            "keys": keys,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/remove')
async def remove_user_key(key_id : str , user_id : str = Depends(get_current_user)):
    try:
        await remove_user_api_key(user_id, key_id)
        return {
            "message": "Key deleted successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))