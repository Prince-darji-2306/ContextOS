import { useState } from "react"
import { GlassCard } from "../components/Card"
import { useThemeStore } from "../store/themeStore"
import { useToast } from "../components/Toast"

function Section({ title, children }) {
  return (
    <GlassCard>
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </GlassCard>
  )
}

function Field({ label, children }) {
  return (
    <div className="grid sm:grid-cols-[200px_1fr] gap-3 items-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore()
  const { success } = useToast()
  
  const [memType, setMemType] = useState("semantic")
  const [ttl, setTtl] = useState("Never")
  const [dedup, setDedup] = useState(0.75)
  const [consolidate, setConsolidate] = useState("6")
  const [summarize, setSummarize] = useState("7")
  const [decay, setDecay] = useState("90")
  const [confirmText, setConfirmText] = useState("")

  // Mock user
  const user = { email: "prince@contextos.com" }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Your preferences and danger zone.</p>
      </div>

      <Section title="Profile">
        <Field label="Email"><div className="font-mono text-sm">{user.email}</div></Field>
        <Field label="New password">
          <input type="password" className="h-10 w-full rounded-lg bg-surface border border-border px-3 text-sm outline-none focus:border-violet" />
        </Field>
        <Field label="">
          <button onClick={() => success("Password updated")} className="h-9 px-4 rounded-lg bg-accent text-text-inverse text-sm font-medium hover:bg-accent-hover transition-colors">Save password</button>
        </Field>
      </Section>

      <Section title="Memory Preferences">
        <Field label="Default memory type">
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {["semantic", "episodic"].map((t) => (
              <button key={t} onClick={() => setMemType(t)}
                className={`px-3 py-1.5 rounded-md text-xs capitalize transition-colors ${memType === t ? "bg-accent text-text-inverse" : "text-text-secondary hover:text-text"}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Default TTL">
          <select value={ttl} onChange={(e) => setTtl(e.target.value)} className="h-9 px-3 rounded-lg bg-surface border border-border text-sm outline-none focus:border-violet cursor-pointer">
            {["Never", "7 days", "30 days", "90 days"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Deduplication threshold">
          <div className="flex items-center gap-3">
            <input type="range" min={0.6} max={0.95} step={0.01} value={dedup} onChange={(e) => setDedup(parseFloat(e.target.value))} className="flex-1 accent-violet" />
            <span className="font-mono text-sm w-10">{dedup.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {dedup < 0.7 ? "Aggressive — merges loosely related memories." : dedup < 0.85 ? "Balanced — recommended for most users." : "Strict — only near-identical memories merge."}
          </p>
        </Field>
      </Section>

      <Section title="Agent Schedule">
        <Field label="Consolidation">
          Runs every
          <select value={consolidate} onChange={(e) => setConsolidate(e.target.value)} className="mx-2 h-9 px-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-violet cursor-pointer">
            {[1, 3, 6, 12, 24].map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          hours
        </Field>
        <Field label="Summarisation">
          Summarise memories older than
          <input value={summarize} onChange={(e) => setSummarize(e.target.value)} className="mx-2 h-9 w-16 px-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-violet" />
          days
        </Field>
        <Field label="Decay">
          Demote memories not accessed in
          <input value={decay} onChange={(e) => setDecay(e.target.value)} className="mx-2 h-9 w-16 px-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-violet" />
          days
        </Field>
      </Section>

      <Section title="Appearance">
        <Field label="Theme">
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {["dark", "light"].map((t) => (
              <button key={t} onClick={() => { if(theme !== t) toggleTheme() }}
                className={`px-3 py-1.5 rounded-md text-xs capitalize transition-colors ${theme === t ? "bg-accent text-text-inverse" : "text-text-secondary hover:text-text"}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <div className="rounded-xl border border-danger/40 bg-danger/5 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-danger">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mt-1">Type <span className="font-mono bg-danger/10 px-1 rounded text-danger">DELETE</span> to enable destructive actions.</p>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="mt-3 h-9 w-full sm:w-64 rounded-lg bg-surface border border-border px-3 text-sm font-mono outline-none focus:border-danger transition-colors" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["Delete all memories", "Export all memories as JSON", "Delete account"].map((b) => (
            <button key={b} disabled={confirmText !== "DELETE"}
              onClick={() => success(b)}
              className="text-xs px-3 py-2 rounded-lg border border-danger/40 text-danger hover:bg-danger/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
