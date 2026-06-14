import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlideOver } from '../components/SlideOver'
import { StatusIndicator } from '../components/StatusIndicator'
import { useToast } from '../components/Toast'
import { formatTimeAgo } from '../lib/utils'
import { useApps, useDeregisterApp } from '../hooks/useApps'
import { Plug, Check, Copy, Terminal, Loader2 } from 'lucide-react'

export default function ConnectedAppsPage() {
  const [selectedApp, setSelectedApp] = useState(null)
  const [activeTab, setActiveTab] = useState('config')
  const [confirm, setConfirm] = useState(null)
  const { success, error } = useToast()

  const { data: apps = [], isLoading, isError } = useApps()
  const deregisterMutation = useDeregisterApp()

  const handleCopyConfig = (config) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    success('Configuration copied to clipboard')
  }

  const handleDeregister = (id) => {
    deregisterMutation.mutate(id, {
      onSuccess: () => {
        setConfirm(null)
        if (selectedApp?.id === id) setSelectedApp(null)
        success('App removed', 'The app has been deregistered.')
      },
      onError: (err) => {
        error('Error', err.response?.data?.detail || 'Failed to deregister app')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return <div className="text-center py-20 text-danger text-sm">Failed to load connected apps.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Connected Apps</h1>
        <p className="text-text-secondary mt-1">
          Apps appear here automatically when they call the MCP server for the first time.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-20">
          <Plug className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
          <p className="mt-4 text-muted-foreground text-sm">No apps connected yet.</p>
          <p className="mt-1 text-muted-foreground text-xs">Connect an MCP client and call <code className="font-mono">remember()</code> to register automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {apps.map((app, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const colors = row === 0
              ? ["text-violet", "text-teal", "text-amber"]
              : row === 1
              ? ["text-amber", "text-violet", "text-teal"]
              : ["text-teal", "text-teal", "text-teal"]
            const iconColor = app.app_id === 'antigravity' ? 'text-amber' : colors[col]
            const Icon = app.icon
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2 }}
                className="card-base card-hover p-6 cursor-pointer"
                onClick={() => { setSelectedApp(app); setActiveTab('config') }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text">{app.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIndicator status={app.status} size="xs" pulse={app.status === 'connected'} />
                        <span className="text-xs text-text-secondary capitalize">{app.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {app.status === 'connected' && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-surface/50">
                      <div className="text-xs text-text-tertiary">Connected</div>
                      <div className="text-sm font-medium text-text">{formatTimeAgo(app.connectedAt)}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface/50">
                      <div className="text-xs text-text-tertiary">Last Sync</div>
                      <div className="text-sm font-medium text-text">
                        {app.lastSync ? formatTimeAgo(app.lastSync) : 'Never'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Transport: {app.config.transport}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* App Detail Slide-over */}
      <SlideOver
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={selectedApp?.name || ''}
        width="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center">
                {(() => {
                  const Icon = selectedApp.icon
                  const index = apps.findIndex((a) => a.id === selectedApp.id)
                  let iconColor = "text-violet"
                  if (index !== -1) {
                    const row = Math.floor(index / 3)
                    const col = index % 3
                    const colors = row === 0
                      ? ["text-violet", "text-teal", "text-amber"]
                      : row === 1
                      ? ["text-amber", "text-violet", "text-teal"]
                      : ["text-teal", "text-teal", "text-teal"]
                    iconColor = selectedApp.app_id === 'antigravity' ? 'text-amber' : colors[col]
                  }
                  return <Icon className={`w-7 h-7 ${iconColor}`} />
                })()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">{selectedApp.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIndicator status={selectedApp.status} size="sm" pulse={selectedApp.status === 'connected'} />
                  <span className="text-sm text-text-secondary capitalize">{selectedApp.status}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-surface/50 border border-border">
              {[{ id: 'config', label: 'Configuration' }, { id: 'setup', label: 'Setup Guide' }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-accent text-text-inverse' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'config' && (
                <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-text">MCP Configuration</label>
                      <button onClick={() => handleCopyConfig(selectedApp.config)} className="btn-ghost text-xs">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-surface border border-border font-mono text-sm text-text-secondary overflow-x-auto">
                      {JSON.stringify({ mcpServers: { contextOS: { url: selectedApp.config.mcpUrl, transport: selectedApp.config.transport } } }, null, 2)}
                    </pre>
                  </div>

                  {selectedApp.status === 'connected' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface/50 border border-border">
                        <div className="text-xs text-text-tertiary mb-1">Connected Since</div>
                        <div className="text-sm font-medium text-text">{formatTimeAgo(selectedApp.connectedAt)}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-surface/50 border border-border">
                        <div className="text-xs text-text-tertiary mb-1">Last Sync</div>
                        <div className="text-sm font-medium text-text">{selectedApp.lastSync ? formatTimeAgo(selectedApp.lastSync) : 'Never'}</div>
                      </div>
                    </div>
                  )}

                  {/* Disconnect App */}
                  {selectedApp.status === 'connected' && (
                    <div className="pt-4 border-t border-border">
                      {confirm === selectedApp.id ? (
                        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-danger-subtle/30 border border-danger/20">
                          <span className="text-xs text-text-secondary font-medium">Are you sure you want to disconnect this app? It will stop syncing memories.</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeregister(selectedApp.id)}
                              disabled={deregisterMutation.isPending}
                              className="flex-1 h-9 rounded-lg bg-danger text-white hover:bg-danger/90 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              {deregisterMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              Yes, Disconnect
                            </button>
                            <button
                              onClick={() => setConfirm(null)}
                              className="flex-1 h-9 rounded-lg border border-border bg-surface text-text hover:bg-surface-hover text-xs font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirm(selectedApp.id)}
                          className="w-full h-10 rounded-xl bg-danger/10 text-danger border border-danger/20 text-sm font-medium hover:bg-danger/20 transition flex items-center justify-center gap-2"
                        >
                          Disconnect App
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'setup' && (
                <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {selectedApp.setupSteps.map((step) => (
                    <div
                      key={step.step}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                        step.completed ? 'bg-success-subtle/30 border-success/20' : 'bg-surface/50 border-border'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.completed ? 'bg-success text-white' : 'bg-surface-hover text-text-tertiary'}`}>
                        {step.completed ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium">{step.step}</span>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-text">{step.title}</h4>
                        <p className="text-xs text-text-secondary mt-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
