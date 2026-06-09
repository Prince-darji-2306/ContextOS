const SAMPLES = [
  ["User prefers JWT-based auth with refresh-token rotation for backend services.", "semantic", "cursor", ["auth", "backend"]],
  ["Project uses Postgres with Prisma; migrations live in /prisma/migrations.", "semantic", "claude-desktop", ["db", "prisma"]],
  ["On 2026-04-11 user refactored billing module to use Stripe webhooks.", "episodic", "cursor", ["billing", "stripe"]],
  ["Summary: design system uses violet primary, teal secondary, JetBrains Mono for code.", "summary", "claude-desktop", ["design"]],
  ["User dislikes excessive comments; keep code self-documenting.", "semantic", "cline", ["style"]],
  ["Deploy target is Cloudflare Workers via wrangler; node_compat enabled.", "semantic", "cursor", ["deploy", "cloudflare"]],
  ["Bug: race condition in concurrent embedding writes — solved with row locks.", "episodic", "windsurf", ["bug", "concurrency"]],
  ["User identifies as Prince Darji, working on ContextOS memory platform.", "semantic", "claude-desktop", ["profile"]],
  ["Conversation 04-29: discussed force-directed graph rendering performance.", "episodic", "cursor", ["graph", "perf"]],
  ["Summary: prefer cosine similarity > 0.6 as default dedup threshold.", "summary", "api", ["dedup"]],
  ["Memory: avoid purple gradients on white backgrounds — visual fatigue.", "semantic", "claude-desktop", ["design"]],
  ["Run consolidation agent every 6 hours; summarisation nightly.", "semantic", "api", ["agents", "schedule"]],
  ["Last bug triage: 3 P1 tickets closed, embedding pipeline latency reduced.", "episodic", "cline", ["triage"]],
  ["User likes minimal, Linear-style UIs with soft motion.", "semantic", "cursor", ["design", "ui"]],
  ["Working on multi-agent coordination spec — draft v3 in Notion.", "episodic", "claude-desktop", ["spec"]],
  ["TTL policy: episodic = 30d, summary = never, semantic = never.", "semantic", "api", ["ttl"]],
  ["User completed onboarding flow at 09:14 UTC.", "episodic", "windsurf", ["onboarding"]],
  ["Summary: weekly digest — 47 memories added, 3 conflicts resolved.", "summary", "api", ["digest"]],
  ["Repo: github.com/princedarji/contextos — main is protected.", "semantic", "cursor", ["repo"]],
  ["Memory recall latency target: p95 < 80ms.", "semantic", "claude-desktop", ["perf", "sla"]],
  ["Discussed embedding model swap to text-embedding-3-large.", "episodic", "cline", ["embeddings"]],
  ["User prefers tabs over spaces in TS, 2-space indent.", "semantic", "cursor", ["style"]],
  ["Onboarding doc lives at /docs/getting-started.md.", "semantic", "claude-desktop", ["docs"]],
  ["Conflict: two memories disagree on default TTL — needs review.", "summary", "api", ["conflict"]],
]

function seeded(i) { return Math.abs(Math.sin(i * 9301 + 49297) * 233280) % 1; }

export const MOCK_MEMORIES = Array.from({ length: 60 }, (_, i) => {
  const [content, type, app, tags] = SAMPLES[i % SAMPLES.length];
  const r = seeded(i);
  return {
    id: `mem_${(i + 1).toString().padStart(4, "0")}`,
    content,
    type,
    app,
    tags,
    createdAt: Date.now() - Math.floor(r * 1000 * 60 * 60 * 24 * 30),
    lastAccessed: Date.now() - Math.floor(seeded(i + 1) * 1000 * 60 * 60 * 24 * 7),
    accessCount: Math.floor(seeded(i + 2) * 30),
    importance: 0.2 + seeded(i + 3) * 0.8,
    ttl: type === "episodic" ? "30 days" : "Never",
    sharedWith: ["cursor", "claude-desktop"],
  };
}).sort((a, b) => b.createdAt - a.createdAt);

export const APPS = [
  { id: "cursor", name: "Cursor", lastSeen: Date.now() - 1000 * 60 * 2, memories: 143, active: true },
  { id: "claude-desktop", name: "Claude Desktop", lastSeen: Date.now() - 1000 * 60 * 1, memories: 78, active: true },
  { id: "cline", name: "Cline", lastSeen: Date.now() - 1000 * 60 * 32, memories: 21, active: false },
  { id: "windsurf", name: "Windsurf", lastSeen: Date.now() - 1000 * 60 * 60 * 4, memories: 5, active: false },
];

export const AGENTS = [
  { name: "Consolidation", status: "idle", lastRun: "2h ago", lastResult: "Merged 3 memories", next: "in 43m" },
  { name: "Summarisation", status: "running", lastRun: "now", lastResult: "Compressing 12 memories", next: "in 6h" },
  { name: "Scorer", status: "idle", lastRun: "1h ago", lastResult: "Updated 47 importance scores", next: "in 23m" },
  { name: "Decay", status: "idle", lastRun: "8m ago", lastResult: "Expired 1 TTL memory", next: "in 2h" },
];

export const AGENT_LOG = Array.from({ length: 30 }, (_, i) => {
  const agents = ["consolidation", "decay", "scorer", "summarisation"];
  const actions = [
    "merged 3 duplicate memories",
    "expired 1 TTL memory",
    "updated 47 importance scores",
    "compressed 12 episodic memories",
    "skipped — nothing to do",
    "failed — embedding timeout",
  ];
  const statuses = ["success", "success", "success", "skipped", "failed"];
  return {
    id: i,
    agent: agents[i % agents.length],
    action: actions[i % actions.length],
    affected: Math.floor(seeded(i) * 50),
    status: statuses[i % statuses.length],
    time: `${i + 2}m ago`,
  };
});

export const API_KEYS = [
  { id: "k1", name: "My Cursor", preview: "ctx_xK92•••••••", created: "Jan 10, 2026", lastUsed: "2 hours ago", status: "active" },
  { id: "k2", name: "Home Claude Desktop", preview: "ctx_a8Bn•••••••", created: "Dec 22, 2025", lastUsed: "5 min ago", status: "active" },
  { id: "k3", name: "Old Laptop", preview: "ctx_qq01•••••••", created: "Oct 03, 2025", lastUsed: "Never", status: "revoked" },
];

export const formatRelative = (ts) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
