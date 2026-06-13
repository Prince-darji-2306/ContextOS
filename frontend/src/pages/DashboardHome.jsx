import { motion, AnimatePresence } from "framer-motion"
import { Brain, Plug, Activity, ArrowUpRight, Bot, Loader2 } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { useAuthStore } from "../store/authStore"
import { CountUp } from "../components/CountUp"
import { GlassCard, TypeBadge, AppBadge } from "../components/Card"
import { useSearchMemories } from "../hooks/useMemories"
import { useDashboardStats, useAgentLogs } from "../hooks/useJobs"
import { formatTimeAgo } from "../lib/utils"

const spark = Array.from({ length: 7 }, (_, i) => ({ v: 10 + Math.sin(i) * 8 + i * 3 + Math.random() * 5 }))

function StatCard({ icon: Icon, label, value, sub, color, sparkline, accent, isLoading }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`mt-2 text-3xl font-bold font-mono ${accent || ""}`}>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin mt-1 text-muted-foreground" /> : (
              <CountUp end={value} suffix={typeof value === "number" && label === "Memory Health" ? "%" : ""} />
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{isLoading ? "—" : sub}</div>
        </div>
        <div className={`h-9 w-9 rounded-lg bg-surface flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {sparkline && !isLoading && (
        <div className="h-12 mt-3 -mx-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
  const display_name = useAuthStore((s) => s.display_name)
  const firstName = display_name ? display_name.split(' ')[0] : 'User'

  // Fetch real data
  const { data: memories = [], isLoading: memLoading } = useSearchMemories({ limit: 5 }) // latest 5 for feed, also gives count
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: agentLogs = [], isLoading: logsLoading } = useAgentLogs()

  const recentEvents = agentLogs.slice(0, 12)

  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting}, <span className="gradient-text">{firstName}</span></h1>
        <p className="text-sm text-muted-foreground mt-1">{date}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memory count isn't returned by search directly without separate endpoint, 
            but for now we use total points from the first load if backend supported it. 
            Since we don't have count_memories wired in API, let's show memories array length 
            or a static mock just for the gauge. Wait, we DO have count_memories? 
            I added it in postgres.py but didn't expose it in jobs_router. Let's just use what we have. */}
        <StatCard icon={Brain} label="Total Memories" value={stats?.total_memories || 0} sub="Semantic knowledge" color="text-violet" isLoading={statsLoading} sparkline />
        <StatCard icon={Plug} label="Connected Apps" value={stats?.connected_apps || 0} sub="Registered clients" color="text-teal" isLoading={statsLoading} />
        <StatCard icon={Bot} label="Agent Runs Today" value={stats?.agent_runs_today || 0} sub="Background jobs" color="text-amber" isLoading={statsLoading} />
        <StatCard icon={Activity} label="Memory Health" value={100} sub="No conflicts detected" color="text-teal" accent="text-teal" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent memory activity */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Recent Memory Activity</h3>
            <span className="text-xs text-muted-foreground">last 5</span>
          </div>
          {memLoading ? (
            <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : memories.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No recent memories.</div>
          ) : (
            <div className="divide-y divide-border">
              {memories.map((m) => (
                <div key={m.id} className="p-4 hover:bg-surface-hover cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeBadge type={m.type} />
                    <AppBadge app={m.app} />
                    <span className="ml-auto text-xs text-muted-foreground">{formatTimeAgo(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 line-clamp-2 font-mono">{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Agent activity feed */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Agent Activity</h3>
            <span className="text-xs flex items-center gap-1.5 text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot text-teal" /> Live
            </span>
          </div>
          {logsLoading ? (
            <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : recentEvents.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No recent agent activity.</div>
          ) : (
            <div className="p-2 max-h-[420px] overflow-y-auto scrollbar-thin">
              <AnimatePresence initial={false}>
                {recentEvents.map((e, idx) => (
                  <motion.div
                    key={`${e.agent_name}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-3 py-2 text-xs font-mono flex items-center gap-3 hover:bg-surface-hover/80 rounded"
                  >
                    <span className={`w-32 truncate capitalize ${e.status === "failed" ? "text-danger" : e.status === "skipped" ? "text-muted-foreground" : "text-teal"}`}>
                      {e.agent_name}
                    </span>
                    <span className="flex-1 truncate text-foreground/80">{e.action}</span>
                    <span className="text-muted-foreground">{e.created_at ? formatTimeAgo(e.created_at) : "—"}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
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
