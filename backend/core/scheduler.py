from repos import get_all_users
from agents import (
    run_decay_agent ,
    run_scorer_agent ,
    run_consolidation_agent ,
    run_summarisation_agent
)

async def scheduled_decay():
    for user_id in await get_all_users():
        await run_decay_agent(user_id)
async def scheduled_scorer():
    for user_id in await get_all_users():
        await run_scorer_agent(user_id)
async def scheduled_consolidation():
    for user_id in await get_all_users():
        await run_consolidation_agent(user_id)
async def scheduled_summarisation():
    for user_id in await get_all_users():
        await run_summarisation_agent(user_id)