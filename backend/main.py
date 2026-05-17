from fastapi import FastAPI
from repos import init_db , close_pool , init_collection

from routers import auth_router, keys_router


app = FastAPI()

app.include_router(auth_router)
app.include_router(keys_router)



@app.get("/health")
def read_root():
    return {"status": "Success"}

@app.on_event("startup")
async def startup_event():
    await init_db()
    await init_collection()
    
@app.on_event("shutdown")
async def shutdown_event():
    await close_pool()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="[IP_ADDRESS]", port=8000)