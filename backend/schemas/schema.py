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