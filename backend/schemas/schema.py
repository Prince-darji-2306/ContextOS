from typing import Any
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class GenerateAPIKeyRequest(BaseModel):
    app_id: str
    app_name: str
    ttl_days: int | None = None

class WriteMemoryRequest(BaseModel):
    app_id: str
    text: str
    tags: list[str]
    memory_type: str
    ttl: int | None = None

class RecallMemoryRequest(BaseModel):
    query: str
    top_k: int
    filters: dict[str, Any] = {}

class SearchMemoryRequest(BaseModel):
    filters: dict[str, Any]
    limit: int = 50
    offset: int = 0