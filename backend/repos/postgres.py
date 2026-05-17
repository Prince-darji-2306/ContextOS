import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

_pool : asyncpg.Pool = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            os.getenv("DATABASE_URL"),
            min_size=4,
            max_size=10,
        )
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

CREATE_TABLES_SQL = """

CREATE TABLE users IF NOT EXISTS(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash    TEXT UNIQUE NOT NULL,
    key_prefix  TEXT NOT NULL,
    app_name    TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    last_used   TIMESTAMPTZ,
    ttl_days    INT DEFAULT 7,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE app_registry (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id        TEXT NOT NULL,
    app_name      TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen     TIMESTAMPTZ
);

CREATE TABLE agent_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name  TEXT NOT NULL,
    user_id     UUID REFERENCES users(id),
    action      TEXT NOT NULL,
    memory_ids  TEXT[],
    status      TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

--Indexes
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_id ON api_keys(id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_app_registry_id ON app_registry(id);
CREATE INDEX IF NOT EXISTS idx_app_registry_user_id ON app_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_id ON agent_logs(id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_logs(user_id);

"""

async def init_db():
    """Initialize database tables if they don't exist."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLES_SQL)
    print("[POSTGRES] Database initialized successfully")


# ---------------Helper Functions---------------
async def create_user(email : str , password_hash : str , name : str) -> str:
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchrow("INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
        email, password_hash, name)

    return str(result['id'])


async def get_user_by_email(email : str) -> dict | None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchrow("SELECT id, password_hash, name FROM users WHERE email = $1", email)
    
    if not result:
        return None
    
    return dict(result)


async def get_user_by_id(id : str) -> dict | None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchrow("SELECT * FROM users WHERE id = $1", id)
    
    if not result:
        return None
    
    return dict(result)


async def store_api_key(user_id: str, app_id: str, app_name: str, key_prefix: str, hashed_key: str, ttl_days: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO api_keys (user_id, app_id, app_name, key_prefix, key_hash, ttl_days)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            user_id, app_id, app_name, key_prefix, hashed_key, ttl_days
        )
