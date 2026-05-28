import logging
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("mcp").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

from fastapi import FastAPI
from mcp_server.server import mcp_router
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from middleware import MCPSessionAuthWrapper
from core import (
    scheduled_decay,
    scheduled_scorer,
    scheduled_consolidation,
    scheduled_summarisation
)
from repos import init_db , close_pool , init_collection
from routers import auth_router, keys_router, memory_router, jobs_router

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await init_collection()
    
    scheduler.add_job(scheduled_consolidation,  "interval", hours=1)
    scheduler.add_job(scheduled_scorer,         "interval", hours=6)
    scheduler.add_job(scheduled_summarisation,  "interval", hours=24)
    scheduler.add_job(scheduled_decay,          "interval", minutes=10)
    scheduler.start()

    yield

    scheduler.shutdown()
    await close_pool()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(keys_router)
app.include_router(memory_router)
app.include_router(jobs_router)
app.mount("/mcp", MCPSessionAuthWrapper(mcp_router.sse_app()))

@app.get("/health")
def read_root():
    return {"status": "Success"}