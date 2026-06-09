from mcp_server.server import resolve_app_id
from fastapi import APIRouter, HTTPException, Depends
from core import get_current_user
from repos import register_app, list_registered_apps, deregister_app
router = APIRouter(prefix="/apps", tags=["Apps"])

@router.get("/register")
async def register_new_app(app_name: str, user_id: str = Depends(get_current_user)):
    try:
        app_id = resolve_app_id(app_name)
        await register_app(user_id, app_id, app_name)
        return {"message": "App registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_user_apps(user_id: str = Depends(get_current_user)):
    try:
        return await list_registered_apps(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/deregister/{id}")
async def deregister_user_app(id: str):
    try:
        await deregister_app(id)
        return {"message": "App deregistered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))