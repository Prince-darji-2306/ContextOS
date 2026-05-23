from urllib.parse import parse_qs
from core import fetch_user_id
from mcp_server.server import active_mcp_sessions


class MCPSessionAuthWrapper:
    def __init__(self, mcp_app):
        self.mcp_app = mcp_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Extract Authorization header
            auth_header = next((v.decode() for k, v in scope.get("headers", []) if k.lower() == b"authorization"), None)
            
            # Extract Session ID from query string
            query_string = scope.get("query_string", b"").decode()
            session_id = parse_qs(query_string).get("sessionId", [None])[0]

            if auth_header and session_id and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                if user_id := fetch_user_id(token):
                    active_mcp_sessions[session_id] = user_id
                    
        # Forward the request directly to the MCP app without breaking the stream
        await self.mcp_app(scope, receive, send)



