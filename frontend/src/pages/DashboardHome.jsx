import { motion, AnimatePresence } from "framer-motion"
import { Brain, Plug, Cpu, Activity, ArrowUpRight, Bot } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"
import { CountUp } from "../components/CountUp"
import { GlassCard, TypeBadge, AppBadge } from "../components/Card"
import { MOCK_MEMORIES, AGENT_LOG, formatRelative } from "../lib/mock"

const spark = Array.from({ length: 7 }, (_, i) => ({ v: 10 + Math.sin(i) * 8 + i * 3 + Math.random() * 5 }))

function StatCard({ icon: Icon, label, value, sub, color, sparkline, accent }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`mt-2 text-3xl font-bold font-mono ${accent || ""}`}>
            <CountUp end={value} suffix={typeof value === "number" && label === "Memory Health" ? "%" : ""} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className={`h-9 w-9 rounded-lg bg-surface flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {sparkline && (
        <div className="h-12 mt-3 -mx-2">
          <ResponsiveContainer>
            <LineChart data={spark}>
              <Line type="monotone" dataKey="v" stroke="hsl(var(--violet))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  )
}

export default function DashboardHome() {
  const recent = MOCK_MEMORIES.slice(0, 5)
  const [events, setEvents] = useState(AGENT_LOG.slice(0, 8))

  useEffect(() => {
    const id = setInterval(() => {
      setEvents((prev) => {
        const next = AGENT_LOG[(Math.floor(Math.random() * AGENT_LOG.length))]
        return [{ ...next, id: Date.now(), time: "just now" }, ...prev].slice(0, 12)
      })
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting}, <span className="gradient-text">Prince</span></h1>
        <p className="text-sm text-muted-foreground mt-1">{date}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Brain} label="Total Memories" value={247} sub="across all apps" color="text-violet" sparkline />
        <StatCard icon={Plug} label="Connected Apps" value={3} sub="Claude · Cursor · Cline" color="text-teal" />
        <StatCard icon={Bot} label="Agent Runs Today" value={42} sub="Last run: 12 min ago" color="text-amber" />
        <StatCard icon={Activity} label="Memory Health" value={94} sub="No conflicts detected" color="text-teal" accent="text-teal" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent memory activity */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Recent Memory Activity</h3>
            <span className="text-xs text-muted-foreground">last 5</span>
          </div>
          <div className="divide-y divide-border">
            {recent.map((m) => (
              <div key={m.id} className="p-4 hover:bg-surface-hover cursor-pointer transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TypeBadge type={m.type} />
                  <AppBadge app={m.app} />
                  <span className="ml-auto text-xs text-muted-foreground">{formatRelative(m.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/90 line-clamp-2">{m.content.slice(0, 80)}{m.content.length > 80 ? "…" : ""}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Agent activity feed */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Agent Activity</h3>
            <span className="text-xs flex items-center gap-1.5 text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot text-teal" /> Live
            </span>
          </div>
          <div className="p-2 max-h-[420px] overflow-y-auto scrollbar-thin">
            <AnimatePresence initial={false}>
              {events.map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="px-3 py-2 text-xs font-mono flex items-center gap-3 hover:bg-surface-hover/80 rounded"
                >
                  <span className={`w-32 truncate ${e.status === "failed" ? "text-danger" : e.status === "skipped" ? "text-muted-foreground" : "text-teal"}`}>
                    {e.agent}
                  </span>
                  <span className="flex-1 truncate text-foreground/80">{e.action}</span>
                  <span className="text-muted-foreground">{e.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold">Memory graph is alive</div>
          <p className="text-xs text-muted-foreground mt-1">See how your knowledge clusters across agents.</p>
        </div>
        <a href="/dashboard/graph" className="inline-flex items-center gap-1.5 text-sm text-violet font-medium hover:underline">
          Open Memory Graph <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </GlassCard>
    </div>
  )
}
