import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from core import get_current_user
from repos import get_pool
from agents import trigger_full_agent_pipeline

router = APIRouter(prefix="/jobs", tags=["jobs"])

ACTIVE_JOBS = {}

@router.post("/trigger")
async def trigger_pipeline_manually(bgtasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    ACTIVE_JOBS[job_id] = {"status": "running", "user_id": user_id}
    
    async def run_pipeline_wrapper():
        try:
            await trigger_full_agent_pipeline(user_id)
            ACTIVE_JOBS[job_id]["status"] = "completed"
        except Exception as e:
            ACTIVE_JOBS[job_id]["status"] = "failed"
            ACTIVE_JOBS[job_id]["error"] = str(e)
            
    bgtasks.add_task(run_pipeline_wrapper)
    return {"job_id": job_id, "status": "running", "message": "Background job started."}

@router.get("/{job_id}")
async def get_job_status(job_id: str, user_id: str = Depends(get_current_user)):
    if job_id in ACTIVE_JOBS:
        job = ACTIVE_JOBS[job_id]
        if job["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized job access")
        return job
        
    # If not in active cache, retrieve execution history logs from Postgres
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT agent_name, action, memory_ids, status, created_at FROM agent_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
            uuid.UUID(user_id)
        )
    return {
        "job_id": job_id,
        "status": "historical",
        "logs": [dict(r) for r in rows]
    }
