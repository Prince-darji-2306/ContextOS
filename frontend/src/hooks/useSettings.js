import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// TTL helpers
const TTL_MAP = {
  'Never': null,
  '7 days': 7,
  '30 days': 30,
  '90 days': 90,
}

const TTL_REVERSE_MAP = {
  null: 'Never',
  7: '7 days',
  30: '30 days',
  90: '90 days',
}

export function ttlLabelToInt(label) {
  return TTL_MAP[label] ?? null
}

export function ttlIntToLabel(days) {
  return TTL_REVERSE_MAP[days] ?? 'Never'
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data // { user_id, default_type, default_ttl, dedup_limit }
    },
    staleTime: 60_000,
  })
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data // { user_id, email, display_name }
    },
    staleTime: 300_000, // 5 minutes — profile rarely changes
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ default_type, default_ttl, dedup_limit }) =>
      api.put('/settings', { default_type, default_ttl, dedup_limit }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (new_password) =>
      api.post('/auth/change-password', null, { params: { new_password } }),
  })
}
