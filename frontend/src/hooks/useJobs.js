import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Agent status cards — one entry per agent (DISTINCT ON agent_name) */
export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent-status'],
    queryFn: async () => {
      const { data } = await api.get('/jobs/agents/status')
      return Array.isArray(data) ? data : []
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}

/** Last 10 historical agent_logs entries for the activity table */
export function useAgentLogs() {
  return useQuery({
    queryKey: ['agent-logs'],
    queryFn: async () => {
      // Use a dummy job_id; the backend falls back to historical logs
      const { data } = await api.get('/jobs/latest-logs').catch(async () => {
        // Fallback: trigger a GET that returns historical logs
        const r = await api.get('/jobs/status-check')
        return r
      })
      return data?.logs ?? []
    },
    refetchInterval: 10_000,
    staleTime: 8_000,
  })
}

/** Dashboard stats (agent_runs_today + connected_apps) */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/jobs/stats/dashboard')
      return data // { agent_runs_today, connected_apps }
    },
    staleTime: 30_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useTriggerPipeline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/jobs/trigger').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-status'] })
      queryClient.invalidateQueries({ queryKey: ['agent-logs'] })
    },
  })
}
