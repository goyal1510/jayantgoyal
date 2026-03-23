import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThreeBgStore {
  enabled: boolean;
  toggle: () => void;
}

export const useThreeBgStore = create<ThreeBgStore>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    { name: 'three-bg', skipHydration: true }
  )
);
