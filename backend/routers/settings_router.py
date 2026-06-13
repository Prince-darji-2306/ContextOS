from fastapi import APIRouter, Depends, HTTPException
from core import get_current_user
from repos import get_user_settings, update_user_settings
from schemas import SettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
async def get_settings(user_id: str = Depends(get_current_user)):
    return await get_user_settings(user_id)

@router.put("")
async def update_settings(req: SettingsUpdateRequest, user_id: str = Depends(get_current_user)):
    await update_user_settings(
        user_id,
        req.default_type,
        req.default_ttl,
        req.dedup_limit
    )
    return {"message": "Settings updated successfully"}
