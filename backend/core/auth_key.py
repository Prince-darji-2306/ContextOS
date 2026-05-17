import bcrypt
import secrets
from jose import jwt
from dotenv import load_dotenv
from jose.exceptions import JWTError
from fastapi import HTTPException, Header
from datetime import datetime, timedelta, timezone

from repos import store_api_key

import os

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(user_id: str):
    payload = {
        'user':user_id,
        "expiry": int((datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)).timestamp()),
        "issued_at": int(datetime.now(timezone.utc).timestamp()),
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


# ------------- API Key Generation & Storage ----------------

async def create_user_api_key(user_id: str , app_id: str , app_name: str , ttl_days: int = 7):

    random_secret = secrets.token_urlsafe(32)
    key_prefix = "ctx-" + app_id + "_"
    key = key_prefix + random_secret

    hashed_key = hash_password(key)
    
    await store_api_key(user_id, app_id, app_name, key_prefix, hashed_key, ttl_days)

    return key
