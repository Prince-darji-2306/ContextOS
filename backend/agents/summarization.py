import os
from datetime import datetime, timezone, timedelta
from groq import AsyncGroq
from repos import insert_agent_log
from schemas import SearchMemoryRequest, WriteMemoryRequest
from services import search_memory, forget_memories, create_memory


async def run_summarization_agent(user_id : str , time_period_in_days : int = 30):
    try:
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=time_period_in_days)).isoformat()
        results = await search_memory(
            user_id,
            SearchMemoryRequest(
                limit=10000,
                filters={
                    "memory_type": "episodic",
                    "created_at": {"gte": cutoff_date}
                }
            )
        )
        memories = results[0] 
        
        if not memories:
            return "No episodic memories found in the specified time period."

        memories_text = "\n".join([f"- {m.payload['content']}" for m in memories])
        llm = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"""You are a memory summarization module. Summarize the following memories into a single, comprehensive, and crisp memory sentence. Maintain any crucial context, preferences, or dates, but avoid redundancy.
        
        Memories to summarize:
        {memories_text}
        
        Output ONLY the clean, summarized memory text. No preamble, no quotes, no notes.
        """
        chat_completion = await llm.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192"
        )
        summarized_memory = chat_completion.choices[0].message.content.strip()
        
        await create_memory(user_id, WriteMemoryRequest(
            app_id='summarizer_agent',
            text=summarized_memory,
            tags=list(set(sum([m.payload.get("tags", []) for m in memories], []))),
            memory_type="summary",
            ttl=None
        ))
        
        memory_ids = [m.id for m in memories]
        await forget_memories(memory_ids)
        await insert_agent_log("summarization_agent", user_id, "summarized_memories", memory_ids, "success")
        
        return summarized_memory
    except Exception as e:
        print(f"Error running summarization agent: {e}")
        return None