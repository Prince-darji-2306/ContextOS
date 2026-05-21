import os
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

# ─── Embedding Model ─────────────────────────────────────────────────────────

_embedding_model: SentenceTransformer | None = None

async def get_embedding_model() -> SentenceTransformer:
    """Get cached SentenceTransformer model."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
    return _embedding_model


async def get_embedding(text: str) -> list[float]:
    """Generate a 384-dim embedding for the given text."""
    model = await get_embedding_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

# ─── Qdrant Client ────────────────────────────────────────────────────────────

_qdrant_client: QdrantClient | None = None

async def get_qdrant_client() -> QdrantClient:
    """Get the global Qdrant client singleton."""
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_CLIENT"),
            api_key=os.getenv("QDRANT_API_KEY"),
        )
    return _qdrant_client


#------------- Setup Qdrant --------------

async def init_collection():
    client = await get_qdrant_client()
    collections = [c.name for c in client.get_collections().collections]

    if "memories" not in collections:
        client.create_collection(
            collection_name="memories",
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print('Creating Collection Memories..')
    
    client.create_payload_index("memories", "user_id",     PayloadSchemaType.KEYWORD)
    client.create_payload_index("memories", "app_id",      PayloadSchemaType.KEYWORD)
    client.create_payload_index("memories", "memory_type", PayloadSchemaType.KEYWORD)
    client.create_payload_index("memories", "tags",        PayloadSchemaType.KEYWORD)
    client.create_payload_index("memories", "created_at",  PayloadSchemaType.DATETIME)
    client.create_payload_index("memories", "ttl",         PayloadSchemaType.DATETIME)
    print('All Index are Created..')
