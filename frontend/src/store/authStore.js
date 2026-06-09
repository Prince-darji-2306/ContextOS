import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user_id: null,
      display_name: null,

      login: (token, user_id, display_name) => set({ token, user_id, display_name }),
      
      logout: () => set({ token: null, user_id: null, display_name: null }),
    }),
    {
      name: 'auth-storage', // name of item in the storage (must be unique)
    }
  )
);
