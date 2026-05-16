from fastapi import FastAPI
from routers import auth_router
from repos import init_db , close_pool


app = FastAPI()

app.include_router(auth_router.router)


@app.get("/health")
def read_root():
    return {"status": "Success"}

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    await close_pool()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="[IP_ADDRESS]", port=8000)