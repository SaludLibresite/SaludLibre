import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSidebarStore = create(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    {
      name: "sidebar-state", // key for localStorage
      getStorage: () => localStorage,
    }
  )
);
