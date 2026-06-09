import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlideOver } from '../components/SlideOver'
import { StatusIndicator } from '../components/StatusIndicator'
import { useToast } from '../components/Toast'
import { connectedApps } from '../data/mockData'
import { formatTimeAgo } from '../lib/utils'
import {
  Plug, Check, Copy, Settings, ExternalLink, ChevronRight,
  Terminal, Code, Play, Bot, Zap, Wrench, Waves, Monitor
} from 'lucide-react'

const appIconMap = {
  Bot,
  Zap,
  Wrench,
  Waves,
  Monitor,
}

export default function ConnectedAppsPage() {
  const [apps, setApps] = useState(connectedApps)
  const [selectedApp, setSelectedApp] = useState(null)
  const [activeTab, setActiveTab] = useState('config')
  const { success } = useToast()

  const handleCopyConfig = (config) => {
    const configStr = JSON.stringify(config, null, 2)
    navigator.clipboard.writeText(configStr)
    success('Configuration copied to clipboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Connected Apps</h1>
        <p className="text-text-secondary mt-1">Manage MCP connections to your AI tools and clients</p>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {apps.map((app, i) => {
          const iconColor = ["text-violet", "text-teal", "text-amber"][i % 3]
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
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                  {(() => {
                    const Icon = appIconMap[app.icon] || Plug
                    return <Icon className={`w-5 h-5 ${iconColor}`} />
                  })()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text">{app.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusIndicator status={app.status} size="xs" pulse={app.status === 'connected'} />
                    <span className="text-xs text-text-secondary capitalize">{app.status}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </div>

            {/* Stats */}
            {app.status === 'connected' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-surface/50">
                  <div className="text-xs text-text-tertiary">Memories</div>
                  <div className="text-sm font-medium text-text">{app.memoriesSynced.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg bg-surface/50">
                  <div className="text-xs text-text-tertiary">Last Sync</div>
                  <div className="text-sm font-medium text-text">{formatTimeAgo(app.lastSync)}</div>
                </div>
              </div>
            )}

            {/* Transport */}
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <Terminal className="w-3.5 h-3.5" />
              <span>Transport: {app.config.transport}</span>
            </div>
          </motion.div>
        )})}
      </div>

      {/* App Detail Slide-over */}
      <SlideOver
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={selectedApp?.name || ''}
        width="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* App Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center">
                {(() => {
                  const Icon = appIconMap[selectedApp.icon] || Plug
                  const index = apps.findIndex(a => a.id === selectedApp.id)
                  const iconColor = index !== -1 ? ["text-violet", "text-teal", "text-amber"][index % 3] : "text-violet"
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

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-surface/50 border border-border">
              {[
                { id: 'config', label: 'Configuration' },
                { id: 'setup', label: 'Setup Guide' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-accent text-text-inverse'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'config' && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-text">MCP Configuration</label>
                      <button
                        onClick={() => handleCopyConfig(selectedApp.config)}
                        className="btn-ghost text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-surface border border-border font-mono text-sm text-text-secondary overflow-x-auto">
                      {JSON.stringify({
                        mcpServers: {
                          contextOS: {
                            command: 'npx',
                            args: ['-g', '@contextos/mcp-server'],
                            transport: selectedApp.config.transport,
                          },
                        },
                      }, null, 2)}
                    </pre>
                  </div>

                  {selectedApp.status === 'connected' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface/50 border border-border">
                        <div className="text-xs text-text-tertiary mb-1">Connected Since</div>
                        <div className="text-sm font-medium text-text">{formatTimeAgo(selectedApp.connectedAt)}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-surface/50 border border-border">
                        <div className="text-xs text-text-tertiary mb-1">Memories Synced</div>
                        <div className="text-sm font-medium text-text">{selectedApp.memoriesSynced.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'setup' && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {selectedApp.setupSteps.map((step, i) => (
                    <div
                      key={step.step}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                        step.completed
                          ? 'bg-success-subtle/30 border-success/20'
                          : 'bg-surface/50 border-border'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        step.completed
                          ? 'bg-success text-white'
                          : 'bg-surface-hover text-text-tertiary'
                      }`}>
                        {step.completed ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{step.step}</span>
                        )}
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
