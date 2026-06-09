import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, AlertTriangle, Key as KeyIcon } from "lucide-react"
import { GlassCard } from "../components/Card"
import { API_KEYS } from "../lib/mock"
import { useToast } from "../components/Toast"

export default function ApiKeysPage() {
  const { success, error } = useToast()
  const [name, setName] = useState("")
  const [expiry, setExpiry] = useState("none")
  const [keys, setKeys] = useState(API_KEYS)
  const [revealed, setRevealed] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const fullKey = "ctx_xK92dF8aL9pQ3rT5uV7wX1yZ_" + Math.random().toString(36).slice(2, 10)

  const generate = () => {
    if (!name.trim()) return error("Error", "Give the key a name")
    const id = "k" + Date.now()
    setKeys([{ id, name, preview: "ctx_xK92•••••••", created: "today", lastUsed: "Never", status: "active" }, ...keys])
    setRevealed(id)
    setName("")
    success("Key generated", "Copy it now. It won't be shown again.")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-muted-foreground mt-1">Each MCP client gets its own key. Revoke anytime.</p>
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-3">Generate new key</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="App name (e.g. My Cursor)"
            className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border outline-none focus:border-violet text-sm" />
          <select value={expiry} onChange={(e) => setExpiry(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface border border-border outline-none focus:border-violet text-sm sm:w-40 cursor-pointer">
            <option value="none">No expiry</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
          <button onClick={generate} className="h-10 px-5 rounded-lg bg-accent text-text-inverse font-medium text-sm hover:bg-accent-hover transition-colors violet-glow shrink-0">
            Generate Key
          </button>
        </div>

        <AnimatePresence>
          {revealed && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden">
              <div className="rounded-lg border border-amber/40 bg-amber/10 p-4">
                <div className="flex items-start gap-2 text-amber text-sm mb-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>Copy this key now. It will never be shown again.</span>
                </div>
                <div className="flex items-center gap-2 mt-2 p-3 rounded-md bg-background/60 font-mono text-sm break-all">
                  <span className="flex-1">{fullKey}</span>
                  <button onClick={() => { navigator.clipboard.writeText(fullKey); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
                    className="h-8 px-3 rounded-md border border-border hover:bg-surface-hover flex items-center gap-1.5 text-xs">
                    {copied ? <><Check className="h-3.5 w-3.5 text-teal" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-12 text-center">
            <KeyIcon className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
            <p className="mt-3 text-sm text-muted-foreground">No API keys yet. Generate one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">App</th><th className="p-4">Key</th><th className="p-4">Created</th>
                  <th className="p-4">Last used</th><th className="p-4">Status</th><th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="p-4 font-medium">{k.name}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{k.preview}</td>
                    <td className="p-4 text-muted-foreground">{k.created}</td>
                    <td className="p-4 text-muted-foreground">{k.lastUsed}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${k.status === "active" ? "bg-teal/15 text-teal border border-teal/30" : "bg-muted text-muted-foreground border border-border"}`}>
                        {k.status === "active" ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {k.status === "active" && (
                        confirm === k.id ? (
                          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-end gap-2 text-xs">
                            <span className="text-muted-foreground">Sure?</span>
                            <button onClick={() => { setKeys((p) => p.map((x) => x.id === k.id ? { ...x, status: "revoked" } : x)); setConfirm(null); success("Revoked", "Key revoked successfully."); }}
                              className="px-2 py-1 rounded bg-danger/15 text-danger border border-danger/30">Yes</button>
                            <button onClick={() => setConfirm(null)} className="px-2 py-1 rounded border border-border">Cancel</button>
                          </motion.div>
                        ) : (
                          <button onClick={() => setConfirm(k.id)} className="text-xs px-3 py-1 rounded border border-border text-muted-foreground hover:bg-danger/15 hover:text-danger hover:border-danger transition">
                            Revoke
                          </button>
                        )
                      )}
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
