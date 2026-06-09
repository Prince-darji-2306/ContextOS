import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, AlertTriangle, Key as KeyIcon, Loader2 } from "lucide-react"
import { GlassCard } from "../components/Card"
import { useToast } from "../components/Toast"
import api from "../lib/api"
import { useEffect } from "react"

export default function ApiKeysPage() {
  const { success, error } = useToast()
  const [name, setName] = useState("")
  const [expiry, setExpiry] = useState("none")
  const [keys, setKeys] = useState([])
  const [revealed, setRevealed] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api-key/list')
      setKeys(res.data.keys || [])
    } catch (err) {
      error("Error", "Failed to fetch API keys")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const generate = async () => {
    const days = expiry === "none" ? null : parseInt(expiry)
    try {
      const res = await api.post(`/api-key/new${days ? `?ttl_days=${days}` : ''}`)
      // The backend returns the full key, but it doesn't store app name yet based on current state.
      // We'll refetch keys and show the new key to the user.
      setRevealed(res.data.key)
      setName("")
      success("Key generated", "Copy it now. It won't be shown again.")
      fetchKeys()
    } catch (err) {
      error("Error", "Failed to generate key")
    }
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
                  <span className="flex-1">{revealed}</span>
                  <button onClick={() => { navigator.clipboard.writeText(revealed); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
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
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
            <p className="text-sm text-muted-foreground">Loading keys...</p>
          </div>
        ) : keys.length === 0 ? (
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
                    <td className="p-4 font-medium">{k.app_name || 'Unnamed App'}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{k.key_prefix}•••••••</td>
                    <td className="p-4 text-muted-foreground">{k.created_at || 'Recently'}</td>
                    <td className="p-4 text-muted-foreground">{k.last_used || 'Never'}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active !== false ? "bg-teal/15 text-teal border border-teal/30" : "bg-muted text-muted-foreground border border-border"}`}>
                        {k.is_active !== false ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {k.is_active !== false && (
                        confirm === k.id ? (
                          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-end gap-2 text-xs">
                            <span className="text-muted-foreground">Sure?</span>
                            <button onClick={async () => { 
                              try {
                                await api.delete(`/api-key/remove?key_id=${k.id}`);
                                setConfirm(null); 
                                success("Revoked", "Key revoked successfully."); 
                                fetchKeys();
                              } catch (err) {
                                error("Error", "Failed to revoke key");
                              }
                            }}
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
