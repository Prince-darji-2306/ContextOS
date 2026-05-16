import bcrypt
from jose import jwt
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import HTTPException, Header
from jose.exceptions import JWTError
from datetime import datetime, timedelta, timezone

import os

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password: str, hashed_password: str):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

def generate_api_key(app_id : str , app_name : str):
    return f"ctxos_pk_{app_id[:8]}_{app_name[:8]}_{uuid4().hex}"


def create_access_token(user_id: str):
    payload = {
        'user':user_id,
        "expiry": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "issued_at": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("user")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing user")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_user(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
    token = authorization.split(" ", 1)[1]
    return decode_token(token)