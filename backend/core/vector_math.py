import numpy as np

def pairwise_cosine_similarity(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    X_normalized = vectors / norms
    return np.dot(X_normalized, X_normalized.T)
