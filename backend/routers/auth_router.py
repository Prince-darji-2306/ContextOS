from fastapi import APIRouter, HTTPException, Depends
from schemas import LoginRequest, RegisterRequest
from repos import get_user_by_email, create_user, update_user_password, get_user_by_id
from core import create_access_token, hash_password, verify_password, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

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


@router.post("/change-password")
async def change_password(new_password: str, user_id: str = Depends(get_current_user)):
    try:
        password_hash = hash_password(new_password)
        await update_user_password(user_id, password_hash)
        return {"message": "Password updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    try:
        user = await get_user_by_id(user_id)
        return {
            "user_id": user_id,
            "email": user["email"],
            "display_name": user["name"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))