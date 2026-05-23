from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from mcp_server.server import mcp_router

from middleware import MCPSessionAuthWrapper
from repos import init_db , close_pool , init_collection
from routers import auth_router, keys_router, memory_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await init_collection()
    yield

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
app.mount("/mcp", MCPSessionAuthWrapper(mcp_router.sse_app()))

@app.get("/health")
def read_root():
    return {"status": "Success"}