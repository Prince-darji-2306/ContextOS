from repos import get_all_users

async def scheduled_decay():
    from agents import run_decay_agent
    for user_id in await get_all_users():
        await run_decay_agent(user_id)

async def scheduled_scorer():
    from agents import run_scorer_agent
    for user_id in await get_all_users():
        await run_scorer_agent(user_id)

async def scheduled_consolidation():
    from agents import run_consolidation_agent
    for user_id in await get_all_users():
        await run_consolidation_agent(user_id)

async def scheduled_summarisation():
    from agents import run_summarization_agent
    for user_id in await get_all_users():
        await run_summarization_agent(user_id)