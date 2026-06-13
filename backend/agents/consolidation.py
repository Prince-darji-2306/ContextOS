import os
import asyncio
import numpy as np
from groq import AsyncGroq
from core import pairwise_cosine_similarity
from repos import insert_agent_log, insert_memory_conflicts_batch
from services import search_memory, forget_memories, create_memory
from schemas import WriteMemoryRequest, SearchMemoryRequest


async def run_consolidation_agent(user_id: str) -> list[str]:
    results = await search_memory(user_id, SearchMemoryRequest(limit=10000), with_vectors=True)
    points = results[0]
    
    if not points or len(points) < 2:
        return []
        
    X = np.array([p.vector for p in points])
    S = pairwise_cosine_similarity(X)
    
    merged_ids = []
    conflicts_to_create = []
    merge_tasks = []
    duplicate_groups = []
    
    groq_api_key = os.getenv("GROQ_API_KEY")
    llm = AsyncGroq(api_key=groq_api_key)
    
    for i in range(len(points)):
        if points[i].id in merged_ids:
            continue
            
        # Search >= 0.82 to capture both Auto-Merges (>0.85) and Conflicts (0.82 - 0.85)
        dup_indices = np.where(S[i] >= 0.82)[0]
        duplicates = []
        
        for idx in dup_indices:
            idx = int(idx)
            if idx <= i or points[idx].id in merged_ids:
                continue
            if points[i].payload.get("memory_type") != points[idx].payload.get("memory_type"):
                continue
                
            similarity = S[i, idx]
            
            # --- 2. BORDERLINE CONFLICT (0.82 <= similarity <= 0.85) ---
            if similarity <= 0.85:
                conflicts_to_create.append({
                    "memory_a_id": points[i].id,
                    "memory_a_text": points[i].payload["content"],
                    "memory_b_id": points[idx].id,
                    "memory_b_text": points[idx].payload["content"],
                    "similarity": float(similarity)
                })
                # Mark as processed for this run to prevent double-matching
                merged_ids.append(points[idx].id)
            
            # --- 3. AUTO-MERGE (> 0.85) ---
            else:
                duplicates.append(points[idx])
                
        if duplicates:
            duplicates.append(points[i])
            dup_ids = [d.id for d in duplicates]
            merged_ids.extend(dup_ids)
            duplicate_groups.append(duplicates)
            
            content_list = [f"- {d.payload['content']}" for d in duplicates]
            combined_text = "\n".join(content_list)
            
            prompt = f"""You are a memory consolidation module. Combine the following near-duplicate memories into a single, comprehensive, and crisp memory sentence. Maintain any crucial context, preferences, or dates, but avoid redundancy.
            
            Memories to merge:
            {combined_text}
            
            Output ONLY the clean, combined memory text. No preamble, no quotes, no notes.
            """
            
            task = llm.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-8b-8192"
            )
            merge_tasks.append(task)
            
    # --- 4. EXECUTE BATCH CONFLICT WRITE IN A SINGLE ROUND-TRIP ---
    if conflicts_to_create:
        await insert_memory_conflicts_batch(user_id, conflicts_to_create)
            
    if not merge_tasks:
        return []
        
    llm_responses = await asyncio.gather(*merge_tasks)
    
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

