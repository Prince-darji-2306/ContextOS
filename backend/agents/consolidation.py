import os
import asyncio
import numpy as np
from groq import AsyncGroq
from repos import insert_agent_log
from services import search_memory, forget_memories, create_memory
from schemas import WriteMemoryRequest, SearchMemoryRequest


async def run_consolidation_agent(user_id: str) -> list[str]:
    results = await search_memory(user_id, SearchMemoryRequest(limit=10000), with_vectors=True)
    points = results[0]
    
    if not points or len(points) < 2:
        return []
        
    # Vectorized similarity matrix calculation
    X = np.array([p.vector for p in points])
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    X_normalized = X / norms
    S = np.dot(X_normalized, X_normalized.T)
    
    merged_ids = []
    merge_tasks = []
    duplicate_groups = []
    
    groq_api_key = os.getenv("GROQ_API_KEY")
    llm = AsyncGroq(api_key=groq_api_key)
    
    for i in range(len(points)):
        if points[i].id in merged_ids:
            continue
            
        # Instantly find all index indices where similarity > 0.85
        dup_indices = np.where(S[i] > 0.85)[0]
        duplicates = []
        
        for idx in dup_indices:
            idx = int(idx)
            if idx <= i: # Avoid self-similarity and duplicate group checks
                continue
            if points[idx].id in merged_ids:
                continue
            if points[i].payload.get("memory_type") == points[idx].payload.get("memory_type"):
                duplicates.append(points[idx])
                
        if duplicates:
            duplicates.append(points[i])
            # Track which IDs are being merged
            dup_ids = [d.id for d in duplicates]
            merged_ids.extend(dup_ids)
            duplicate_groups.append(duplicates)
            
            # Prepare LLM Prompts
            content_list = [f"- {d.payload['content']}" for d in duplicates]
            combined_text = "\n".join(content_list)
            
            prompt = f"""You are a memory consolidation module. Combine the following near-duplicate memories into a single, comprehensive, and crisp memory sentence. Maintain any crucial context, preferences, or dates, but avoid redundancy.
            
            Memories to merge:
            {combined_text}
            
            Output ONLY the clean, combined memory text. No preamble, no quotes, no notes.
            """
            
            # Create the task (do NOT await it yet!)
            task = llm.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-8b-8192"
            )
            merge_tasks.append(task)
            
    if not merge_tasks:
        return []
        
    # Execute all LLM calls concurrently!
    # A N-second sequential wait is condensed to the duration of the single slowest call (approx. 1s).
    llm_responses = await asyncio.gather(*merge_tasks)
    
    # Process completions and batch write/delete in background
    for idx, response in enumerate(llm_responses):
        merged_content = response.choices[0].message.content.strip()
        duplicates = duplicate_groups[idx]
        dup_ids = [d.id for d in duplicates]
        
        req = WriteMemoryRequest(
            app_id=duplicates[0].payload.get("app_id", "agent_system"),
            text=merged_content,
            tags=list(set(sum([d.payload.get("tags", []) for d in duplicates], []))),
            memory_type=duplicates[0].payload.get("memory_type", "semantic"),
            ttl=None
        )
        
        await create_memory(user_id, req)
        await forget_memories(dup_ids)
        await insert_agent_log("consolidation_agent", user_id, "merged_duplicates", dup_ids, "success")
        
    return merged_ids
