from core.auth_key import fetch_user_id
from mcp_server.server import current_user_id

class MCPSessionAuthWrapper:
    def __init__(self, mcp_app):
        self.mcp_app = mcp_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            auth_header = next((v.decode() for k, v in scope.get("headers", []) if k.lower() == b"authorization"), None)
            
            if auth_header and auth_header.startswith("Bearer "):
                try:
                    token = auth_header.split(" ")[1]
                    user_id = await fetch_user_id(token)
                    if user_id:
                        current_user_id.set(user_id)
                except Exception as e:
                    import traceback
                    with open("middleware_error.log", "a") as f:
                        f.write(traceback.format_exc() + "\n")
                    
        # Forward the request directly to the MCP app without breaking the stream
        await self.mcp_app(scope, receive, send)
