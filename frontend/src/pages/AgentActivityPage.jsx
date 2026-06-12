import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Layers, FileText, Target, Trash2, CheckCircle, Loader2, Play } from "lucide-react"
import { GlassCard, TypeBadge, AppBadge } from "../components/Card"
import { useAgentStatus, useAgentLogs, useTriggerPipeline } from "../hooks/useJobs"
import { useMemoryConflicts, useResolveConflict } from "../hooks/useMemories"
import { useToast } from "../components/Toast"
import { formatTimeAgo } from "../lib/utils"

const agentIcons = {
  "consolidation": Layers,
  "summarisation": FileText,
  "scorer": Target,
  "decay": Trash2,
}

// Fallback cards shown when backend has no agent_log rows yet
const AGENT_DEFAULTS = [
  { agent_name: "consolidation", action: "No run yet", status: "idle", created_at: null },
  { agent_name: "summarisation", action: "No run yet", status: "idle", created_at: null },
  { agent_name: "scorer",        action: "No run yet", status: "idle", created_at: null },
  { agent_name: "decay",         action: "No run yet", status: "idle", created_at: null },
]

export default function AgentActivityPage() {
  const [filterAgent, setFilterAgent] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { success, error } = useToast()

  const { data: agentStatus = [], isLoading: statusLoading } = useAgentStatus()
  const { data: agentLogs = [], isLoading: logsLoading } = useAgentLogs()
  const { data: conflicts = [] } = useMemoryConflicts()
  const [resolvedIds, setResolvedIds] = useState(new Set())
  const resolveConflict = useResolveConflict()
  const triggerPipeline = useTriggerPipeline()

  // Merge real data with fallback defaults (so all 4 cards always show)
  const agentCards = AGENT_DEFAULTS.map((def) => {
    const real = agentStatus.find((a) => a.agent_name === def.agent_name)
    return real ? real : def
  })

  const visibleConflicts = conflicts.filter((c) => !resolvedIds.has(c.conflict_id))

  // Filter logs
  const rows = agentLogs.filter((r) =>
    (filterAgent === "all" || r.agent_name === filterAgent) &&
    (filterStatus === "all" || r.status === filterStatus)
  )

  const handleResolve = (conflict_id) => {
    setResolvedIds((prev) => new Set([...prev, conflict_id]))
    resolveConflict.mutate({ conflict_id, action: "acknowledged" })
  }

  const handleTrigger = () => {
    triggerPipeline.mutate(undefined, {
      onSuccess: () => success("Pipeline triggered", "Background agents started."),
      onError: (err) => error("Error", err.response?.data?.detail || "Failed to trigger pipeline"),
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agent Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">Background agents keep your memory clean, scored, and current.</p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggerPipeline.isPending}
          className="h-9 px-4 rounded-lg bg-accent text-text-inverse text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {triggerPipeline.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Agents Now
        </button>
      </div>

      {/* Agent Status Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agentCards.map((a, i) => {
          const statusColor = a.status === "running" ? "text-teal" : a.status === "failed" ? "text-danger" : "text-muted-foreground"
          const Icon = agentIcons[a.agent_name] || Cpu
          const iconColor = ["text-violet", "text-teal", "text-amber"][i % 3]
          return (
            <GlassCard key={a.agent_name}>
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <span className={`text-xs flex items-center gap-1.5 ${statusColor}`}>
                  {a.status === "running" && <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot" />}
                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </span>
              </div>
              <h3 className="mt-3 font-semibold capitalize">{a.agent_name}</h3>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <div>Last run: <span className="text-foreground">{a.created_at ? formatTimeAgo(a.created_at) : "Never"}</span></div>
                <div className="truncate">{a.action}</div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Memory conflicts */}
      <AnimatePresence>
        {visibleConflicts.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard>
              <h3 className="font-semibold mb-4">Review memory conflicts</h3>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {visibleConflicts.map((c) => (
                    <motion.div
                      key={c.conflict_id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-xl border border-border bg-surface/50 p-5"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        {[c.memory_a, c.memory_b].map((m, idx) => (
                          <div key={idx} className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm font-mono leading-relaxed">{m?.content ?? "—"}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {["Keep Left", "Keep Right", "Keep Both"].map((label) => (
                          <button
                            key={label}
                            onClick={() => handleResolve(c.conflict_id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-violet/50 hover:bg-violet/10"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity log */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Activity log</h3>
          <div className="flex gap-2">
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="h-8 px-2 rounded-md bg-surface border border-border text-xs outline-none"
            >
              <option value="all">All agents</option>
              {["consolidation", "summarisation", "scorer", "decay"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-2 rounded-md bg-surface border border-border text-xs outline-none"
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="skipped">Skipped</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        {logsLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
            <p className="mt-3 text-sm text-muted-foreground">No agent activity yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface/95 backdrop-blur border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="p-3 text-left">Agent</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.agent_name}-${i}`}
                    className={`border-b border-border last:border-0 ${
                      r.status === "failed" ? "bg-danger/5" : r.status === "skipped" ? "bg-muted/30" : "hover:bg-surface-hover/30 transition-colors"
                    }`}
                  >
                    <td className="p-3 font-mono text-teal text-xs capitalize">{r.agent_name}</td>
                    <td className="p-3 text-foreground/80">{r.action}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "success" ? "bg-teal/15 text-teal" :
                        r.status === "failed" ? "bg-danger/15 text-danger" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {r.created_at ? formatTimeAgo(r.created_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
