import numpy as np
from datetime import datetime, timezone
from services import search_memory
from schemas import SearchMemoryRequest
from repos import get_qdrant_client, insert_agent_log
from qdrant_client.models import SetPayloadOperation, SetPayload

async def run_scorer_agent(user_id: str) -> list[str]:
    results = await search_memory(user_id, SearchMemoryRequest(limit=1000), with_vectors=True)
    points = results[0]
    
    if not points or len(points) < 2:
        return []
        
    client = await get_qdrant_client()
    point_ids = [p.id for p in points]
    
    # ─── VECTORIZED PAIRWISE SIMILARITY MATRIX (THE CORE OPTIMIZATION) ───
    # Stack all vectors into a single 2D NumPy array: Shape (N, D)
    X = np.array([p.vector for p in points])
    
    # Compute the L2 norm of each row (handling division by zero)
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    
    # Normalize rows to unit length
    X_normalized = X / norms
    
    # Calculate the entire pairwise Cosine Similarity Matrix: Shape (N, N)
    # Since rows are normalized, S[i, j] = dot(x_i, x_j) which is exactly the cosine similarity!
    S = np.dot(X_normalized, X_normalized.T)
    
    # Calculate centrality: sum rows, subtract 1.0 (self-similarity on diagonal), divide by (N - 1)
    N_points = len(points)
    centrality_scores = (np.sum(S, axis=1) - 1.0) / (N_points - 1)
    
    # Access frequency normalization
    access_counts = [p.payload.get("access_count", 0) for p in points]
    max_access = max(access_counts) if max(access_counts) > 0 else 1
    
    operations = []
    for i, p in enumerate(points):
        created = datetime.fromisoformat(p.payload.get("created_at"))
        days_old = (datetime.now(timezone.utc) - created).days
        recency_score = 1.0 / (1.0 + max(0, days_old))
        
        access_score = access_counts[i] / max_access
        centrality_score = float(centrality_scores[i])
        
        importance = (0.4 * access_score) + (0.3 * recency_score) + (0.3 * centrality_score)
        importance = min(1.0, max(0.0, importance))
        
        operations.append(
            SetPayloadOperation(
                set_payload=SetPayload(points=[p.id], payload={"importance": round(importance, 3)})
            )
        )
        
    if operations:
        client.batch_update_points(collection_name="memories", update_operations=operations)
        await insert_agent_log("scorer_agent", user_id, "recalculated_importance", point_ids, "success")
        
    return point_ids
