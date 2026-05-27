from typing import Any, TypedDict
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

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
    filters: dict[str, Any] = {}
    limit: int = 50
    offset: int = 0

class AgentState(TypedDict):
    user_id: str
    task: str
    memory_ids: list[str]
    status: str
    retries: int
    result: dict