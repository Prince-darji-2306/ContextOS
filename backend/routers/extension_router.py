from fastapi import APIRouter, Depends, Header, BackgroundTasks, HTTPException
from pydantic import BaseModel
from core import fetch_user_id
from repos import get_user_by_id
from schemas import RecallMemoryRequest, WriteMemoryRequest
from services import recall_memory, batch_update_scores_and_stats, create_memory

router = APIRouter(prefix="/extension", tags=["Chrome Extension"])


# ─── Request Models ──────────────────────────────────────────

class ExtensionRememberRequest(BaseModel):
    content: str
    platform: str = "unknown"
    tags: list[str] = []


# ─── Auth Dependency ─────────────────────────────────────────

async def get_extension_user(authorization: str = Header(...)) -> str:
    """Resolve user_id from API key (same as MCP auth but for REST)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ", 1)[1]
    user_id = await fetch_user_id(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user_id


# ─── /extension/recall ───────────────────────────────────────

@router.post("/recall")
async def extension_recall(
    query: str,
    top_k: int = 5,
    platform: str = "unknown",
    bgtasks: BackgroundTasks = None,
    user_id: str = Depends(get_extension_user),
):
    """
    Same as /memories/recall but returns a pre-formatted injection block
    string that the content script can directly prepend to the user's message.
    """
    req = RecallMemoryRequest(query=query, top_k=top_k, filters={})
    result = await recall_memory(user_id, req)

    if bgtasks:
        bgtasks.add_task(batch_update_scores_and_stats, result.points)

    # Format as injection block
    memories = []
    for point in result.points:
        content = point.payload.get("content", "")
        memories.append(f"• {content}")

    if not memories:
        return {"has_context": False, "injection_block": "", "memory_count": 0}

    injection_block = "[ContextOS Memory — auto-injected]\n" + "\n".join(memories) + "\n\n[User message]\n"

    return {
        "has_context": True,
        "injection_block": injection_block,
        "memory_count": len(memories),
        "memories": [
            {
                "id": p.id,
                "content": p.payload.get("content"),
                "type": p.payload.get("memory_type"),
                "score": p.score,
            }
            for p in result.points
        ],
    }


# ─── /extension/remember ─────────────────────────────────────

@router.post("/remember")
async def extension_remember(
    body: ExtensionRememberRequest,
    user_id: str = Depends(get_extension_user),
):
    """
    Stores an LLM response as an episodic memory.
    Tagged with the source platform (chatgpt, gemini, grok, claude-web).
    """
    platform_app_ids = {
        "chatgpt": "chatgpt-web",
        "gemini": "gemini-web",
        "grok": "grok-web",
        "claude-web": "claude-web",
    }
    app_id = platform_app_ids.get(body.platform, f"{body.platform}-web")

    req = WriteMemoryRequest(
        text=body.content,
        app_id=app_id,
        tags=["extension", body.platform] + body.tags,
        memory_type="episodic",
        ttl=None,
    )
    return await create_memory(user_id, req)


# ─── /extension/config ───────────────────────────────────────

@router.get("/config")
async def extension_config():
    """
    Returns the latest DOM selectors for each platform.
    This allows hot-updating selectors without republishing the extension.
    No authentication required — public config endpoint.
    """
    return {
        "version": "1.0.0",
        "platforms": {
            "chatgpt": {
                "host": "chatgpt.com",
                "textareaSelectors": [
                    "#prompt-textarea",
                    "div[contenteditable='true'][id='prompt-textarea']",
                    "div#prompt-textarea[contenteditable]",
                ],
                "sendButtonSelectors": [
                    "[data-testid='send-button']",
                    "button[data-testid='send-button']",
                    "form button[type='button']:last-child",
                ],
                "responseSelectors": [
                    "[data-message-author-role='assistant']",
                    ".agent-turn .markdown",
                ],
                "inputType": "contenteditable",
            },
            "gemini": {
                "host": "gemini.google.com",
                "textareaSelectors": [
                    ".ql-editor",
                    "div.ql-editor[contenteditable='true']",
                    ".input-area-container .ql-editor",
                    "div[contenteditable='true']",
                    "textarea[aria-label]",
                ],
                "sendButtonSelectors": [
                    ".send-button",
                    "button.send-button",
                    "[aria-label='Send message']",
                    "button[aria-label='Send']",
                ],
                "responseSelectors": [
                    ".model-response-text",
                    ".response-container .markdown",
                    "message-content",
                ],
                "inputType": "contenteditable",
            },
            "grok": {
                "host": "grok.com",
                "textareaSelectors": [
                    "textarea",
                    "textarea[placeholder]",
                    "textarea[role='textbox']",
                    "div[contenteditable='true']",
                ],
                "sendButtonSelectors": [
                    "button[aria-label='Send']",
                    "button[type='submit']",
                    "form button:last-child",
                ],
                "responseSelectors": [
                    "[class*='message'][class*='assistant']",
                    ".message-content",
                ],
                "inputType": "textarea",
            },
            "claude-web": {
                "host": "claude.ai",
                "textareaSelectors": [
                    "div[contenteditable='true'].ProseMirror",
                    "fieldset div[contenteditable='true']",
                    "[contenteditable='true']",
                ],
                "sendButtonSelectors": [
                    "button[aria-label='Send message']",
                    "button[aria-label='Send Message']",
                    "fieldset button:last-child",
                ],
                "responseSelectors": [
                    "[data-is-streaming]",
                    ".font-claude-message",
                ],
                "inputType": "contenteditable",
            },
        },
    }
