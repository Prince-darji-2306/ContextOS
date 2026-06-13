import os
import asyncpg
from contextlib import asynccontextmanager
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

@asynccontextmanager
async def get_connection():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


CREATE_TABLES_SQL = """

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    api_name    TEXT NOT NULL,
    key_hash    TEXT UNIQUE NOT NULL,
    key_prefix  TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    last_used   TIMESTAMPTZ,
    ttl_days    INT DEFAULT 7,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS app_registry (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id        TEXT NOT NULL,
    app_name      TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_app UNIQUE (user_id, app_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_type  TEXT DEFAULT 'semantic',
    default_ttl   INT DEFAULT NULL,
    dedup_limit   DOUBLE PRECISION DEFAULT 0.85
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name  TEXT NOT NULL,
    user_id     UUID REFERENCES users(id),
    action      TEXT NOT NULL,
    memory_ids  TEXT[],
    status      TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_conflicts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    memory_a_id   UUID NOT NULL,
    memory_a_text TEXT NOT NULL,
    memory_b_id   UUID NOT NULL,
    memory_b_text TEXT NOT NULL,
    similarity    DOUBLE PRECISION NOT NULL,
    action        TEXT DEFAULT 'pending',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    resolved_at   TIMESTAMPTZ,
    
    CONSTRAINT unique_conflict_pair UNIQUE(memory_a_id, memory_b_id)
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
CREATE INDEX IF NOT EXISTS idx_conflicts_user_pending ON memory_conflicts(user_id, action);

"""

async def init_db():
    """Initialize database tables if they don't exist."""
    async with get_connection() as conn:
        await conn.execute(CREATE_TABLES_SQL)
    print("[POSTGRES] Database initialized successfully")


# ---------------Helper Functions---------------
async def create_user(email : str , password_hash : str , name : str) -> str:
    async with get_connection() as conn:
        result = await conn.fetchrow("INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
        email, password_hash, name)
    return str(result['id'])


async def get_user_by_email(email : str) -> dict | None:
    async with get_connection() as conn:
        result = await conn.fetchrow("SELECT id, password_hash, name FROM users WHERE email = $1", email)
    if not result:
        return None
    return dict(result)


async def get_user_by_id(id : str) -> dict | None:
    async with get_connection() as conn:
        result = await conn.fetchrow("SELECT * FROM users WHERE id = $1", id)
    if not result:
        return None
    return dict(result)


async def update_user_password(user_id: str, password_hash: str):
    async with get_connection() as conn:
        await conn.execute("UPDATE users SET password_hash = $1 WHERE id = $2::uuid", password_hash, user_id)


# ------------- API Key Functions ----------------
async def store_api_key(user_id: str, api_name: str, ttl_days: int, key_prefix: str, hashed_key: str):
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO api_keys (user_id, api_name, key_hash, key_prefix, ttl_days)
            VALUES ($1, $2, $3, $4, $5)
            """,
            user_id, api_name, hashed_key, key_prefix, ttl_days
        )

async def get_user_api_keys(user_id: str):
    async with get_connection() as conn:
        rows = await conn.fetch(
            "SELECT id, api_name, key_prefix, last_used, ttl_days, created_at, is_active "
            "FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC",
            user_id
        )
    return [dict(row) for row in rows]

async def remove_user_api_key(id: str):
    async with get_connection() as conn:
        await conn.execute("UPDATE api_keys SET is_active = False WHERE id = $1::uuid", id)

async def get_stored_api_key_hash(prefix:str):
    async with get_connection() as conn:
        result = await conn.fetchrow('SELECT id, user_id, key_hash FROM api_keys WHERE key_prefix = $1', prefix)
    if result: return result
    return None

async def update_api_usage(id: str):
    async with get_connection() as conn:
        await conn.execute("UPDATE api_keys SET last_used = NOW() WHERE id = $1", id)


#-------------Agent Logs Functions----------------
async def insert_agent_log(agent_name: str, user_id: str, action: str, memory_ids: list[str], status: str):
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO agent_logs (agent_name, user_id, action, memory_ids, status)
            VALUES ($1, $2, $3, $4, $5)
            """,
            agent_name, user_id, action, memory_ids, status
        )

async def get_agent_logs(user_id: str, limit: int = 20):
    async with get_connection() as conn:
        rows = await conn.fetch("SELECT * FROM agent_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", user_id, limit)
    return [dict(row) for row in rows]

async def get_agent_log_by_id(id: str):
    async with get_connection() as conn:
        result = await conn.fetchrow("SELECT * FROM agent_logs WHERE id = $1", id)
    return dict(result) if result else None


async def get_all_users() -> list[str]:
    async with get_connection() as conn:
        rows = await conn.fetch("SELECT id FROM users")
    return [str(row['id']) for row in rows]

#----------- Memory Conflicts -----------------
async def fetch_pending_conflicts(user_id: str):
    async with get_connection() as conn:
        rows = await conn.fetch(
            "SELECT * FROM memory_conflicts WHERE user_id = $1 AND action = 'pending' ORDER BY similarity DESC",
            user_id
        )
    return [dict(row) for row in rows]

async def resolve_memory_conflict(conflict_id: str, user_id: str, action:str):
    async with get_connection() as conn:
        await conn.execute(
            """
            UPDATE memory_conflicts 
            SET action = $1, resolved_at = NOW() 
            WHERE id = $2 AND user_id = $3
            """,
            action,
            conflict_id,
            user_id
        )

async def insert_memory_conflicts_batch(user_id: str, conflicts: list[dict]):
    data = [
        (
            user_id,
            c["memory_a_id"],
            c["memory_a_text"],
            c["memory_b_id"],
            c["memory_b_text"],
            c["similarity"]
        )
        for c in conflicts
    ]
    async with get_connection() as conn:
        await conn.executemany(
            """
            INSERT INTO memory_conflicts (user_id, memory_a_id, memory_a_text, memory_b_id, memory_b_text, similarity)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (memory_a_id, memory_b_id) DO NOTHING
            """,
            data
        )

# ------------- Apps Functions --------------
async def register_app(user_id: str, app_id: str, app_name: str):
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO app_registry (user_id, app_id, app_name, last_seen)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id, app_id) DO UPDATE
                SET app_name  = EXCLUDED.app_name,
                    last_seen = NOW()
            """,
            user_id, app_id, app_name
        )

async def list_registered_apps(user_id: str, count: bool = False):
    async with get_connection() as conn:
        if count:
            return await conn.fetchval(
                "SELECT COUNT(*) FROM app_registry WHERE user_id = $1",
                user_id
            )
        rows = await conn.fetch(
            "SELECT id, app_id, app_name, registered_at, last_seen "
            "FROM app_registry WHERE user_id = $1 ORDER BY registered_at DESC",
            user_id
        )
    return [dict(row) for row in rows]

async def deregister_app(id: str):
    async with get_connection() as conn:
        await conn.execute("DELETE FROM app_registry WHERE id = $1", id)


# ------------- Settings Functions --------------
async def get_user_settings(user_id: str) -> dict:
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM user_settings WHERE user_id = $1::uuid", user_id)
        if not row:
            row = await conn.fetchrow(
                """
                INSERT INTO user_settings (user_id)
                VALUES ($1::uuid)
                RETURNING *
                """,
                user_id
            )
    return dict(row)

async def update_user_settings(user_id: str, default_type: str, default_ttl: int | None, dedup_limit: float):
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO user_settings (user_id, default_type, default_ttl, dedup_limit)
            VALUES ($1::uuid, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE
            SET default_type = EXCLUDED.default_type,
                default_ttl = EXCLUDED.default_ttl,
                dedup_limit = EXCLUDED.dedup_limit
            """,
            user_id, default_type, default_ttl, dedup_limit
        )
