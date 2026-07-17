"use client"

import * as React from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ToolsUsageState {
  favoriteToolIds: string[]
  syncFromServer: (favoriteToolIds: string[]) => void
  toggleFavorite: (toolId: string) => void
}

let hasRequestedServerUsage = false

async function syncToolUsageAction(action: string, toolId: string) {
  try {
    const response = await fetch("/api/tools/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, toolId }),
    })

    if (!response.ok) {
      console.error("Unable to sync tools usage action", action)
    }
  } catch (error) {
    console.error("Unable to sync tools usage action", error)
  }
}

async function fetchServerUsage() {
  try {
    const response = await fetch("/api/tools/usage")

    if (!response.ok) {
      console.error("Unable to load tools usage")
      return
    }

    const usage = (await response.json()) as {
      authenticated?: unknown
      favoriteToolIds?: unknown
    }

    if (usage.authenticated === false) return
    if (!Array.isArray(usage.favoriteToolIds)) return

    useToolsUsageStore.getState().syncFromServer(
      usage.favoriteToolIds.filter(
        (toolId): toolId is string => typeof toolId === "string",
      ),
    )
  } catch (error) {
    console.error("Unable to load tools usage", error)
  }
}

function fetchServerUsageOnce() {
  if (hasRequestedServerUsage) return
  hasRequestedServerUsage = true
  void fetchServerUsage()
}

export const useToolsUsageStore = create<ToolsUsageState>()(
  persist(
    (set) => ({
      favoriteToolIds: [],

      syncFromServer: (favoriteToolIds) => set({ favoriteToolIds }),

      toggleFavorite: (toolId) =>
        set((state) => {
          const isFavorite = state.favoriteToolIds.includes(toolId)
          void syncToolUsageAction(
            isFavorite ? "remove-favorite" : "add-favorite",
            toolId,
          )
          return {
            favoriteToolIds: isFavorite
              ? state.favoriteToolIds.filter((id) => id !== toolId)
              : [...state.favoriteToolIds, toolId],
          }
        }),
    }),
    {
      name: "tools-usage-storage",
      skipHydration: true,
      version: 1,
      partialize: (state) => ({ favoriteToolIds: state.favoriteToolIds }),
    },
  ),
)

export function useToolsUsageHydration() {
  const [hasHydrated, setHasHydrated] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true

    if (useToolsUsageStore.persist.hasHydrated()) {
      setHasHydrated(true)
      fetchServerUsageOnce()
      return () => {
        isMounted = false
      }
    }

    void Promise.resolve(useToolsUsageStore.persist.rehydrate()).finally(() => {
      if (isMounted) {
        setHasHydrated(true)
        fetchServerUsageOnce()
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return hasHydrated
}
