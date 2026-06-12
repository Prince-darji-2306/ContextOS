import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Trash2, Copy, X, Database, Loader2 } from "lucide-react"
import { GlassCard, TypeBadge, AppBadge } from "../components/Card"
import { useToast } from "../components/Toast"
import { useSearchMemories, useRecallMemories, useForgetMemories } from "../hooks/useMemories"
import { formatTimeAgo } from "../lib/utils"

// Re-export for detail panel compatibility
function formatRelative(ts) {
  return formatTimeAgo(new Date(ts).toISOString())
}

export default function MemoryBrowser() {
  const toast = useToast()
  const [q, setQ] = useState("")
  const [type, setType] = useState("all")
  const [app, setApp] = useState("all")
  const [sort, setSort] = useState("recent")
  const [open, setOpen] = useState(null)

  // Switch between browse (no query) and semantic recall (with query)
  const isSearching = q.trim().length > 0

  const filters = useMemo(() => {
    const f = {}
    if (type !== "all") f.memory_type = type
    if (app !== "all") f.app_id = app
    return f
  }, [type, app])

  const browseQuery = useSearchMemories({ filters, limit: 50, offset: 0 })
  const recallQuery = useRecallMemories({ query: q, top_k: 50, filters, enabled: isSearching })

  const rawList = isSearching ? recallQuery.data ?? [] : browseQuery.data ?? []
  const isLoading = isSearching ? recallQuery.isLoading : browseQuery.isLoading
  const isError = isSearching ? recallQuery.isError : browseQuery.isError

  const forgetMutation = useForgetMemories()

  // Client-side sort only (server doesn't support sort_by yet)
  const list = useMemo(() => {
    const r = [...rawList]
    if (sort === "recent") r.sort((a, b) => b.createdAt - a.createdAt)
    else if (sort === "accessed") r.sort((a, b) => b.accessCount - a.accessCount)
    else if (sort === "importance") r.sort((a, b) => b.importance - a.importance)
    return r
  }, [rawList, sort])

  const handleDelete = (id) => {
    forgetMutation.mutate([id], {
      onSuccess: () => {
        if (open?.id === id) setOpen(null)
        toast.success("Memory deleted", "The memory has been removed")
      },
      onError: (err) => {
        toast.error("Error", err.response?.data?.detail || "Failed to delete memory")
      },
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Memory Browser</h1>
        <p className="text-sm text-muted-foreground mt-1">Search, filter, and inspect every memory.</p>
      </div>

      <GlassCard className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search memories semantically…"
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface border border-border outline-none focus:border-violet text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 px-3 rounded-lg bg-surface border border-border outline-none">
            <option value="all">All types</option>
            <option value="semantic">Semantic</option>
            <option value="episodic">Episodic</option>
            <option value="summary">Summary</option>
          </select>
          <select value={app} onChange={(e) => setApp(e.target.value)} className="h-9 px-3 rounded-lg bg-surface border border-border outline-none">
            <option value="all">All apps</option>
            <option value="cursor">Cursor</option>
            <option value="claude-desktop">Claude Desktop</option>
            <option value="cline">Cline</option>
            <option value="windsurf">Windsurf</option>
            <option value="context-os">ContextOS</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 px-3 rounded-lg bg-surface border border-border outline-none ml-auto">
            <option value="recent">Most Recent</option>
            <option value="accessed">Most Accessed</option>
            <option value="importance">Importance</option>
          </select>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-danger text-sm">Failed to load memories.</div>
      ) : list.length === 0 ? (
        <div className="text-center py-20">
          <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
          <p className="mt-4 text-muted-foreground">
            {isSearching ? "No memories match your search." : "No memories yet. Store your first one via MCP."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence>
            {list.map((m) => (
              <motion.div
                key={m.id}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className="group glass glass-hover rounded-xl p-5 relative cursor-pointer"
                onClick={() => setOpen(m)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TypeBadge type={m.type} />
                  <AppBadge app={m.app} />
                  <span className="ml-auto text-xs text-muted-foreground">{formatRelative(m.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed font-mono text-foreground/90">{m.content}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet/10 text-violet border border-violet/20">#{t}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${m.importance * 100}%`,
                        background: m.importance > 0.7 ? "hsl(var(--teal))" : m.importance > 0.4 ? "hsl(var(--amber))" : "hsl(var(--muted-foreground))",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">accessed {m.accessCount}×</span>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(m.content)
                      toast.success("Copied", "Memory content copied to clipboard")
                    }}
                    className="h-7 w-7 rounded-md bg-surface/80 backdrop-blur border border-border flex items-center justify-center hover:bg-surface-hover"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(m.id)
                    }}
                    disabled={forgetMutation.isPending}
                    className="h-7 w-7 rounded-md bg-surface/80 backdrop-blur border border-border flex items-center justify-center hover:bg-danger/20 hover:border-danger text-danger disabled:opacity-50"
                  >
                    {forgetMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Memory Detail Slide-over */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setOpen(null)}
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-border z-50 overflow-y-auto scrollbar-thin"
            >
              <div className="sticky top-0 bg-surface/95 backdrop-blur p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm font-mono text-muted-foreground truncate">{open.id}</span>
                <button onClick={() => setOpen(null)} className="h-8 w-8 rounded-md hover:bg-surface-hover flex items-center justify-center shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={open.type} />
                  <AppBadge app={open.app} />
                </div>
                <div className="glass p-4 rounded-lg font-mono text-sm leading-relaxed">{open.content}</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    ["Created", new Date(open.createdAt).toLocaleString()],
                    ["Last accessed", formatRelative(open.lastAccessed)],
                    ["Access count", String(open.accessCount)],
                    ["Importance", open.importance.toFixed(2)],
                    ["TTL", open.ttl],
                    ["Shared with", open.sharedWith.join(", ") || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="p-3 rounded-lg bg-muted">
                      <div className="text-muted-foreground">{k}</div>
                      <div className="mt-1 font-mono">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {open.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded-full bg-violet/10 text-violet border border-violet/20">#{t}</span>
                  ))}
                </div>
                <div className="flex gap-2 pt-4 border-t border-border">
                  <button
                    onClick={() => { navigator.clipboard.writeText(open.id); toast.success("Memory ID copied", "Copied to clipboard") }}
                    className="flex-1 h-10 rounded-lg border border-border hover:bg-surface-hover text-sm"
                  >
                    Copy ID
                  </button>
                  <button
                    onClick={() => handleDelete(open.id)}
                    disabled={forgetMutation.isPending}
                    className="flex-1 h-10 rounded-lg bg-danger/15 text-danger border border-danger/30 text-sm hover:bg-danger/25 disabled:opacity-50"
                  >
                    Delete memory
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
