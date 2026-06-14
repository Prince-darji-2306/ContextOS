import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatTimeAgo } from '../lib/utils'
import { Bot, Zap, Wrench, Waves, Monitor, Plug, Terminal } from 'lucide-react'

// ─── App-ID to icon component mapping ────────────────────────────────────────
export const APP_ICON_MAP = {
  'cursor':         Zap,
  'claude-desktop': Bot,
  'claude-code':    Bot,
  'claude-web':     Bot,
  'cline':          Wrench,
  'windsurf':       Waves,
  'vs-code':        Monitor,
  'continue-dev':   Terminal,
  'context-os':     Plug,
  'antigravity':    Bot,
}

// Static setup steps per app_id — kept in frontend since backend has no concept of this
function getSetupSteps(app_id) {
  const base = [
    { step: 1, title: 'Generate an API key', description: 'Go to API Keys and create a key for this app.', completed: true },
    { step: 2, title: 'Add MCP config', description: 'Add the ContextOS MCP server to your app config.', completed: true },
    { step: 3, title: 'Connect and test', description: 'Use the remember() tool to store your first memory.', completed: false },
  ]
  return base
}

// ─── Shape adapter ────────────────────────────────────────────────────────────
function adaptApp(app) {
  return {
    id: String(app.id),
    app_id: app.app_id,
    name: app.app_name,
    icon: APP_ICON_MAP[app.app_id] || Plug,
    status: app.last_seen ? 'connected' : 'disconnected',
    connectedAt: app.registered_at,
    lastSync: app.last_seen,
    memoriesSynced: 0,   // Not tracked per-app in current backend
    config: {
      mcpUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/mcp`,
      transport: 'sse',
    },
    setupSteps: getSetupSteps(app.app_id),
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const { data } = await api.get('/apps/list')
      const fetchedApps = Array.isArray(data) ? data : []

      const PREDEFINED_APPS = [
        { app_id: 'cursor', app_name: 'Cursor' },
        { app_id: 'claude-desktop', app_name: 'Claude Desktop' },
        { app_id: 'cline', app_name: 'Cline' },
        { app_id: 'windsurf', app_name: 'Windsurf' },
        { app_id: 'vs-code', app_name: 'VS Code' },
        { app_id: 'continue-dev', app_name: 'Continue' },
        { app_id: 'context-os', app_name: 'ContextOS' },
        { app_id: 'antigravity', app_name: 'Antigravity' },
      ]

      const adaptedFetched = fetchedApps.map(adaptApp)
      const result = []

      // Add predefined apps first, resolving to connected state if they exist in DB
      PREDEFINED_APPS.forEach(pre => {
        const found = adaptedFetched.find(a => a.app_id === pre.app_id)
        if (found) {
          result.push(found)
        } else {
          result.push({
            id: `predefined-${pre.app_id}`,
            app_id: pre.app_id,
            name: pre.app_name,
            icon: APP_ICON_MAP[pre.app_id] || Plug,
            status: 'disconnected',
            connectedAt: null,
            lastSync: null,
            memoriesSynced: 0,
            config: {
              mcpUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/mcp`,
              transport: 'sse',
            },
            setupSteps: getSetupSteps(pre.app_id),
          })
        }
      })

      // Add any other custom fetched apps
      const predefinedIds = new Set(PREDEFINED_APPS.map(p => p.app_id))
      adaptedFetched.forEach(a => {
        if (!predefinedIds.has(a.app_id)) {
          result.push(a)
        }
      })

      return result
    },
    staleTime: 30_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useRegisterApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (app_name) =>
      api.post('/apps/register', null, { params: { app_name } }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps'] }),
  })
}

export function useDeregisterApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/apps/deregister/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps'] }),
  })
}
