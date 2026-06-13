from fastapi import APIRouter, Depends
from core import get_current_user
from mcp_server.server import resolve_app_id
from repos import register_app, list_registered_apps, deregister_app

router = APIRouter(prefix="/apps", tags=["Apps"])

@router.post("/register")
async def register_new_app(app_name: str, user_id: str = Depends(get_current_user)):
    app_id = resolve_app_id(app_name)
    await register_app(user_id, app_id, app_name)
    return {"message": "App registered successfully"}

@router.get("/list")
async def list_user_apps(user_id: str = Depends(get_current_user)):
    return await list_registered_apps(user_id)

@router.delete("/deregister/{id}")
async def deregister_user_app(id: str):
    await deregister_app(id)
    return {"message": "App deregistered successfully"}
