import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Shape adapter: Qdrant point → frontend memory ───────────────────────────
export function adaptMemory(point) {
  const p = point.payload ?? point
  return {
    id: String(point.id ?? point.memory_id),
    content: p.content ?? '',
    type: p.memory_type ?? 'semantic',
    app: p.app_id ?? '',
    tags: p.tags ?? [],
    createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
    lastAccessed: p.last_accessed ? new Date(p.last_accessed).getTime() : Date.now(),
    accessCount: p.access_count ?? 0,
    importance: p.importance ?? 0.5,
    ttl: p.ttl
      ? (() => {
          const ms = new Date(p.ttl) - Date.now()
          if (ms <= 0) return 'Expired'
          const days = Math.ceil(ms / 86_400_000)
          return `${days} day${days !== 1 ? 's' : ''}`
        })()
      : 'Never',
    sharedWith: p.shared_with ?? [],
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Filtered browse — when there is no search query.
 * Uses POST /memories/search with optional filters + pagination.
 */
export function useSearchMemories({ filters = {}, limit = 50, offset = 0 } = {}) {
  return useQuery({
    queryKey: ['memories', 'search', filters, limit, offset],
    queryFn: async () => {
      const { data } = await api.post('/memories/search', { filters, limit, offset })
      // data is a tuple [points[], next_offset] from Qdrant scroll
      const points = Array.isArray(data) ? data[0] : data
      return (Array.isArray(points) ? points : []).map(adaptMemory)
    },
    staleTime: 30_000,
  })
}

/**
 * Semantic recall — when the user types a search query.
 */
export function useRecallMemories({ query, top_k = 50, filters = {}, enabled = true }) {
  return useQuery({
    queryKey: ['memories', 'recall', query, top_k, filters],
    queryFn: async () => {
      const { data } = await api.post('/memories/recall', { query, top_k, filters })
      // data.points from RecallResult schema
      const points = data?.points ?? data ?? []
      return (Array.isArray(points) ? points : []).map(adaptMemory)
    },
    enabled: enabled && !!query?.trim(),
    staleTime: 20_000,
  })
}

/**
 * Graph data for MemoryGraph page.
 */
export function useMemoryGraph(threshold = 0.65) {
  return useQuery({
    queryKey: ['memory-graph', threshold],
    queryFn: async () => {
      const { data } = await api.get('/memories/graph', { params: { threshold } })
      return data // { nodes: [...], edges: [...] }
    },
    staleTime: 60_000,
  })
}

/**
 * Pending memory conflicts for AgentActivityPage.
 */
export function useMemoryConflicts() {
  return useQuery({
    queryKey: ['memory-conflicts'],
    queryFn: async () => {
      const { data } = await api.get('/memories/conflicts')
      return Array.isArray(data) ? data : []
    },
    refetchInterval: 30_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useForgetMemories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids) => {
      // FastAPI accepts list[str] as repeated query params: ?memory_ids=a&memory_ids=b
      const params = new URLSearchParams()
      ids.forEach((id) => params.append('memory_ids', id))
      return api.delete(`/memories/forget?${params.toString()}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] })
      queryClient.invalidateQueries({ queryKey: ['memory-graph'] })
    },
  })
}

export function useResolveConflict() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ conflict_id, memory_id, action }) =>
      api.put('/memories/resolve-conflict', { conflict_id, memory_id, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memory-conflicts'] }),
  })
}
