import os
import numpy as np
from groq import AsyncGroq
from services import search_memory, forget_memories, create_memory
from schemas import WriteMemoryRequest, SearchMemoryRequest
from repos.postgres import insert_agent_log

async def run_consolidation_agent(user_id: str) -> list[str]:
    points = await search_memory(user_id, SearchMemoryRequest(), with_vectors=True)
    if not points or len(points) < 2:
        return []
        
    # Find pairwise duplicates (similarity > 0.85)
    vectors = [p.vector for p in points]
    merged_ids = []
    
    llm = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    
    for i in range(len(points)):
        if points[i].id in merged_ids:
            continue
            
        vec_i = np.array(vectors[i])
        duplicates = []
        
        for j in range(i + 1, len(points)):
            if points[j].id in merged_ids:
                continue
                
            vec_j = np.array(vectors[j])
            similarity = np.dot(vec_i, vec_j) / (np.linalg.norm(vec_i) * np.linalg.norm(vec_j))
            
            if similarity > 0.85 and points[i].payload.get("memory_type") == points[j].payload.get("memory_type"):
                duplicates.append(points[j])
                
        if duplicates:
            duplicates.append(points[i])
            # Merge duplicate text via LLM
            content_list = [f"- {d.payload['content']}" for d in duplicates]
            combined_text = "\n".join(content_list)
            
            prompt = f"""You are a memory consolidation module. Combine the following near-duplicate memories into a single, comprehensive, and crisp memory sentence. Maintain any crucial context, preferences, or dates, but avoid redundancy.
            
            Memories to merge:
            {combined_text}
            
            Output ONLY the clean, combined memory text. No preamble, no quotes, no notes.
            """
            
            chat_completion = await llm.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-8b-8192"
            )
            merged_content = chat_completion.choices[0].message.content.strip()
            
            # Create the merged memory
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
            merged_ids.extend(dup_ids)
            
    return merged_ids
