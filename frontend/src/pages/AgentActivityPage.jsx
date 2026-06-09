import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, AlertTriangle, Layers, FileText, Target, Trash2, CheckCircle } from "lucide-react"
import { GlassCard, TypeBadge, AppBadge } from "../components/Card"

const agentIcons = {
  "Consolidation": Layers,
  "Summarisation": FileText,
  "Scorer": Target,
  "Decay": Trash2
}
import { AGENTS, AGENT_LOG, MOCK_MEMORIES } from "../lib/mock"

export default function AgentActivityPage() {
  const [filterAgent, setFilterAgent] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [conflicts, setConflicts] = useState([
    { id: "c1", a: MOCK_MEMORIES[0], b: MOCK_MEMORIES[15] },
    { id: "c2", a: MOCK_MEMORIES[3], b: MOCK_MEMORIES[9] },
  ])
  const [showConflictsPanel, setShowConflictsPanel] = useState(true)

  useEffect(() => {
    if (conflicts.length === 0 && showConflictsPanel) {
      const t = setTimeout(() => setShowConflictsPanel(false), 2000)
      return () => clearTimeout(t)
    }
  }, [conflicts.length, showConflictsPanel])

  const rows = AGENT_LOG.filter((r) => (filterAgent === "all" || r.agent === filterAgent) && (filterStatus === "all" || r.status === filterStatus))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Background agents keep your memory clean, scored, and current.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENTS.map((a, i) => {
          const statusColor = a.status === "running" ? "text-teal" : a.status === "failed" ? "text-danger" : "text-muted-foreground"
          const Icon = agentIcons[a.name] || Cpu
          const iconColor = ["text-violet", "text-teal", "text-amber"][i % 3]
          return (
            <GlassCard key={a.name}>
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <span className={`text-xs flex items-center gap-1.5 ${statusColor}`}>
                  {a.status === "running" && <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot text-teal" />}
                  {a.status[0].toUpperCase() + a.status.slice(1)}
                </span>
              </div>
              <h3 className="mt-3 font-semibold">{a.name}</h3>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <div>Last run: <span className="text-foreground">{a.lastRun}</span></div>
                <div>{a.lastResult}</div>
                <div>Next: <span className="text-foreground">{a.next}</span></div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Conflicts panel */}
      <AnimatePresence>
        {showConflictsPanel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="mb-4 overflow-hidden">
            <GlassCard>
              <h3 className="font-semibold mb-4">Review memory conflicts</h3>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {conflicts.map((c) => (
                    <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-xl border border-border bg-surface/50 p-5">
                      <div className="grid md:grid-cols-2 gap-4">
                        {[c.a, c.b].map((m, i) => (
                          <div key={i} className="rounded-lg border border-border bg-surface p-4">
                            <div className="flex gap-2 mb-2">
                              <TypeBadge type={m.type} /><AppBadge app={m.app} />
                            </div>
                            <p className="text-sm font-mono leading-relaxed">{m.content}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {["Keep Left", "Keep Right", "Keep Both"].map((label) => (
                          <button key={label}
                            onClick={() => setConflicts((p) => p.filter((x) => x.id !== c.id))}
                            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-violet/50 hover:bg-violet/10">
                            {label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {conflicts.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-teal py-4 justify-center">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">All conflicts cleared.</span>
                  </motion.div>
                )}
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
            <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="h-8 px-2 rounded-md bg-surface border border-border text-xs outline-none">
              <option value="all">All agents</option>
              {["consolidation", "summarisation", "scorer", "decay"].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-8 px-2 rounded-md bg-surface border border-border text-xs outline-none">
              <option value="all">All statuses</option><option value="success">Success</option><option value="skipped">Skipped</option><option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <tr><th className="p-3 text-left">Agent</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Affected</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Time</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-b border-border last:border-0
                  ${r.status === "failed" ? "bg-danger/5" : r.status === "skipped" ? "bg-muted/30" : "hover:bg-surface-hover/30 transition-colors"}`}>
                  <td className="p-3 font-mono text-teal text-xs">{r.agent}</td>
                  <td className="p-3 text-foreground/80">{r.action}</td>
                  <td className="p-3 font-mono text-xs">{r.affected}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${r.status === "success" ? "bg-teal/15 text-teal" : r.status === "failed" ? "bg-danger/15 text-danger" : "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
