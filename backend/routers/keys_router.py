from core import get_current_user , create_user_api_key
from schemas import GenerateAPIKeyRequest
from fastapi import APIRouter, Depends, HTTPException


router = APIRouter()

@router.post("/api-key")
async def generate_api_key(req : GenerateAPIKeyRequest , user_id : str = Depends(get_current_user)):
    try:
        key =  create_user_api_key(user_id, req.app_id, req.app_name, req.ttl_days)
        return {
            "key": key,
            "user_id": user_id,
            "app_id": req.app_id,
            "app_name": req.app_name,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))