from typing import Any
from fastapi import Request
from asyncio import create_task
from mcp.server.fastmcp import FastMCP
from services import create_memory,search_memory,recall_memory,forget_memories, batch_update_scores_and_stats

# import sys
# from pathlib import Path
# sys.path.append(str(Path(__file__).parent.parent))
from schemas import WriteMemoryRequest, RecallMemoryRequest, SearchMemoryRequest

mcp_router = FastMCP("ContextOS")

@mcp_router.tool()
async def remember(
    app_name : str,
    text: str,
    tags: list[str] = [],
    memory_type: str = "semantic",
    ttl_days: int | None = None,
    client_req: Request = None) -> dict:

    app_id = await resolve_app_id(app_name)
    user_id = client_req.state.user_id

    req = WriteMemoryRequest(
        text=text,
        app_id=app_id,
        tags=tags,
        memory_type=memory_type,
        ttl=ttl_days
    )
    return await create_memory(user_id, req)

@mcp_router.tool()
async def recall(
    query: str,
    top_k: int = 5,
    filters: dict[str, Any] = {},
    client_req: Request = None) -> dict:

    user_id = client_req.state.user_id
    req = RecallMemoryRequest(
        query=query,
        top_k=top_k,
        filters=filters
    )
    result = await recall_memory(user_id, req)
    create_task(batch_update_scores_and_stats(result.points))
            
    return result

@mcp_router.tool()
async def search(
    filters: dict[str, Any] = {},
    limit: int = 50,
    offset: int = 0,
    client_req: Request = None) -> dict:
            
    user_id = client_req.state.user_id
    req = SearchMemoryRequest(filters=filters, offset=offset, limit=limit)
    return await search_memory(user_id, req)

@mcp_router.tool()
async def forget(
    memory_ids: list[str],
    client_req: Request = None) -> dict:

    user_id = client_req.state.user_id
    return await forget_memories(user_id,memory_ids)


async def resolve_app_id(app_name: str) -> str:
    app_ids = {"Claude Desktop": "claude-desktop",
    "Claude Web": "claude-web",
    "Cursor": "cursor",
    "Cline": "cline",
    "Windsurf": "windsurf",
    "Continue.dev": "continue-dev",
    "Zed": "zed"}

    if app_name in app_ids:
        return app_ids[app_name]
    else:
        return 'context-os'