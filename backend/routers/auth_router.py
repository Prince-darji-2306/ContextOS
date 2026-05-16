from fastapi import APIRouter, HTTPException
from schemas import LoginRequest, RegisterRequest
from repos import get_user_by_email , create_user 
from core import create_access_token, hash_password, verify_password

router = APIRouter()

@router.post("/register")
async def register(req : RegisterRequest):
    try:
        existing = await get_user_by_email(req.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        password_hash = hash_password(req.password)
        user_id = await create_user(req.email, password_hash, req.name)
        token = create_access_token(user_id)

        return {
            "token": token,
            "user_id": user_id,
            "display_name": req.name,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(req : LoginRequest):
    try:
        user = await get_user_by_email(req.email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token(str(user["id"]))

        return {
            "token": token,
            "user_id": str(user["id"]),
            "display_name": user.get("name"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    