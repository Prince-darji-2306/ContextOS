import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('contextos-theme', theme)
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('contextos-theme', newTheme)
    return { theme: newTheme }
  }),
  initTheme: () => {
    const saved = localStorage.getItem('contextos-theme')
    if (saved) {
      document.documentElement.classList.toggle('dark', saved === 'dark')
      set({ theme: saved })
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
      set({ theme: prefersDark ? 'dark' : 'light' })
    }
  }
}))
