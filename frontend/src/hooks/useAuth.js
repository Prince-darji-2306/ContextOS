import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  return useMutation({
    mutationFn: ({ email, password }) =>
      api.post('/auth/login', { email, password }).then((r) => r.data),
    onSuccess: (data) => {
      // data: { token, user_id, display_name }
      setAuth(data)
      navigate(from, { replace: true })
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ name, email, password }) =>
      api.post('/auth/register', { name, email, password }).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data)
      navigate('/dashboard', { replace: true })
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return () => {
    logout()
    navigate('/login', { replace: true })
  }
}
