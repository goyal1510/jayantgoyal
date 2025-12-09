'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CalculatorStore, CalculatorComponent } from "@/types";

export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set) => ({
      components: [],
      darkMode: false, // Default to false to match system preference

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      addComponent: (component: CalculatorComponent) => set((state) => {
        const exists = state.components.some((comp) => comp.label === component.label);
        if (exists) {
          if (typeof window !== 'undefined') {
            window.alert(`"${component.label}" is already added!`);
          }
          return state;
        }
        return { components: [...state.components, component] };
      }),

      removeComponent: (index: number) => set((state) => ({
        components: state.components.filter((_, i) => i !== index),
      })),

      clearComponents: () => set({ components: [] }),
    }),
    {
      name: 'calculator-storage',
      skipHydration: true,
    }
  )
);
