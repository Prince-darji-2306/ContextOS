import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user_id: null,
      display_name: null,

      /** Called after a successful login or register */
      setAuth: ({ token, user_id, display_name }) =>
        set({ token, user_id, display_name }),

      /** Clear all auth state — also handled automatically via localStorage by the api.js 401 interceptor */
      logout: () => set({ token: null, user_id: null, display_name: null }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'contextos-auth',
      // Only persist the three core fields — keep the store small
      partialize: (state) => ({
        token: state.token,
        user_id: state.user_id,
        display_name: state.display_name,
      }),
    }
  )
)
