from fastapi import Request
from core import fetch_user_id
from mcp_server.server import active_mcp_sessions
from starlette.middleware.base import BaseHTTPMiddleware

class MCPSessionAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/mcp"):
            session_id = request.query_params.get("sessionId")
            auth_header = request.headers.get("Authorization")
            
            if session_id and auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                
                # Thanks to lru_cache, this takes 0ms if we've seen the token recently
                user_id = fetch_user_id(token) 
                
                if user_id:
                    active_mcp_sessions[session_id] = user_id

        return await call_next(request)


