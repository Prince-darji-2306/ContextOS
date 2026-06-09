import { create } from 'zustand'

export const useSidebarStore = create((set) => ({
  collapsed: false,
  toggle: () => set((state) => ({ collapsed: !state.collapsed })),
  collapse: () => set({ collapsed: true }),
  expand: () => set({ collapsed: false }),
}))
