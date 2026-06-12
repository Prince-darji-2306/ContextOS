import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatDate, formatTimeAgo } from '../lib/utils'

// ─── Shape adapter: backend → frontend ───────────────────────────────────────
function adaptKey(k) {
  return {
    id: String(k.id),
    name: k.api_name,
    preview: `${k.key_prefix}•••••••`,
    created: formatDate(k.created_at),
    lastUsed: k.last_used ? formatTimeAgo(k.last_used) : 'Never',
    status: k.is_active ? 'active' : 'revoked',
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await api.get('/api-key/list')
      // Backend returns { keys: [...] }
      return (data.keys ?? data).map(adaptKey)
    },
    staleTime: 60_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useGenerateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, ttl_days }) =>
      api
        .post('/api-key/new', null, {
          params: {
            api_name: name,
            ...(ttl_days ? { ttl_days } : {}),
          },
        })
        .then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key_id) =>
      api.delete('/api-key/remove', { params: { key_id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}
