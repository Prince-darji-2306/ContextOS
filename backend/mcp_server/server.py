from typing import Any
from asyncio import create_task
from mcp.server.fastmcp import FastMCP, Context
from repos import register_app
from agents import run_summarization_agent
from services import create_memory, search_memory, recall_memory, forget_memories, batch_update_scores_and_stats

from schemas import WriteMemoryRequest, RecallMemoryRequest, SearchMemoryRequest

mcp_router = FastMCP("ContextOS")

from contextvars import ContextVar

current_user_id: ContextVar[str | None] = ContextVar("current_user_id", default=None)
_registered_cache: set[tuple[str, str]] = set()

# ─── App-Registry  ──────────────────────────────────────────
async def _ensure_app_registered(user_id: str, app_id: str, app_name: str) -> None:
    cache_key = (user_id, app_id)
    if cache_key in _registered_cache:
        return 
    try:
        await register_app(user_id, app_id, app_name)
        _registered_cache.add(cache_key)
    except Exception as exc:
        print(f"[MCP][auto-registry] Failed to register app {app_id!r} for {user_id!r}: {exc}")


# ─── MCP Tools ──────────────────────────────────────────────
@mcp_router.tool()
async def remember(
    ctx: Context,
    app_name: str,
    text: str,
    tags: list[str] = [],
    memory_type: str = "semantic",
    ttl_days: int | None = None,
) -> dict:
    app_id = await resolve_app_id(app_name)
    user_id = current_user_id.get()
    if not user_id:
        raise Exception("Unauthorised MCP Session")

    # Fire-and-forget: register the app on first use so it appears in the dashboard.
    # create_task schedules the coroutine in the running event loop without blocking.
    create_task(_ensure_app_registered(user_id, app_id, app_name))

    req = WriteMemoryRequest(
        text=text,
        app_id=app_id,
        tags=tags,
        memory_type=memory_type,
        ttl=ttl_days,
    )
    return await create_memory(user_id, req)


@mcp_router.tool()
async def recall(
    ctx: Context,
    query: str,
    top_k: int = 5,
    filters: dict[str, Any] = {}) -> dict:
    
    user_id = current_user_id.get()
    req = RecallMemoryRequest(query=query, top_k=top_k, filters=filters)
    result = await recall_memory(user_id, req)
    create_task(batch_update_scores_and_stats(result.points))
    return result


@mcp_router.tool()
async def search(
    ctx: Context,
    filters: dict[str, Any] = {},
    limit: int = 50,
    offset: int = 0) -> dict:
    user_id = current_user_id.get()
    req = SearchMemoryRequest(filters=filters, offset=offset, limit=limit)
    return await search_memory(user_id, req)


@mcp_router.tool()
async def forget(ctx: Context, memory_ids: list[str]) -> dict:
    return await forget_memories(memory_ids)


@mcp_router.tool()
async def summarize(ctx: Context, time_period_in_days: int) -> dict:
    user_id = current_user_id.get()
    return await run_summarization_agent(user_id, time_period_in_days)

async def resolve_app_id(app_name: str) -> str:
    app_ids = {
        "Claude Code":        "claude-code",
        "Claude Desktop":     "claude-desktop",
        "Cursor":             "cursor",
        "Cline":              "cline",
        "Windsurf":           "windsurf",
        "Continue.dev":       "continue-dev",
        "VS Code (Copilot)":  "vs-code",
        "Zed":                "zed",
        "Antigravity":        "antigravity",
    }
    return app_ids.get(app_name, "context-os")