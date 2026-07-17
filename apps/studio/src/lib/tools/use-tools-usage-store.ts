"use client"

import * as React from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ToolHistoryEntry {
  toolId: string
  visitedAt: string
  visitCount: number
}

interface ToolsUsageState {
  favoriteToolIds: string[]
  history: ToolHistoryEntry[]
  syncFromServer: (
    usage: Pick<ToolsUsageState, "favoriteToolIds" | "history">
  ) => void
  toggleFavorite: (toolId: string) => void
  recordVisit: (toolId: string) => void
  removeHistoryItem: (toolId: string) => void
  clearHistory: () => void
}

const MAX_HISTORY_ITEMS = 20
let hasRequestedServerUsage = false

async function syncToolUsageAction(action: string, toolId?: string) {
  try {
    const response = await fetch("/api/tools/usage", {
      method: action === "clear-history" ? "DELETE" : "POST",
      headers:
        action === "clear-history"
          ? undefined
          : { "Content-Type": "application/json" },
      body:
        action === "clear-history"
          ? undefined
          : JSON.stringify({
              action,
              toolId,
            }),
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
      history?: unknown
    }

    if (usage.authenticated === false) return

    if (!Array.isArray(usage.favoriteToolIds) || !Array.isArray(usage.history)) {
      return
    }

    useToolsUsageStore.getState().syncFromServer({
      favoriteToolIds: usage.favoriteToolIds.filter(
        (toolId): toolId is string => typeof toolId === "string"
      ),
      history: usage.history
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null
          const candidate = entry as Record<string, unknown>
          if (
            typeof candidate.toolId !== "string" ||
            typeof candidate.visitedAt !== "string" ||
            typeof candidate.visitCount !== "number"
          ) {
            return null
          }
          return {
            toolId: candidate.toolId,
            visitedAt: candidate.visitedAt,
            visitCount: candidate.visitCount,
          }
        })
        .filter((entry): entry is ToolHistoryEntry => entry !== null),
    })
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
      history: [],

      syncFromServer: (usage) =>
        set({
          favoriteToolIds: usage.favoriteToolIds,
          history: usage.history.slice(0, MAX_HISTORY_ITEMS),
        }),

      toggleFavorite: (toolId) =>
        set((state) => {
          const isFavorite = state.favoriteToolIds.includes(toolId)
          void syncToolUsageAction(
            isFavorite ? "remove-favorite" : "add-favorite",
            toolId
          )
          return {
            favoriteToolIds: isFavorite
              ? state.favoriteToolIds.filter((id) => id !== toolId)
              : [...state.favoriteToolIds, toolId],
          }
        }),

      recordVisit: (toolId) =>
        set((state) => {
          const existing = state.history.find((entry) => entry.toolId === toolId)
          void syncToolUsageAction("record-history", toolId)
          const nextEntry: ToolHistoryEntry = {
            toolId,
            visitedAt: new Date().toISOString(),
            visitCount: existing ? existing.visitCount + 1 : 1,
          }

          return {
            history: [
              nextEntry,
              ...state.history.filter((entry) => entry.toolId !== toolId),
            ].slice(0, MAX_HISTORY_ITEMS),
          }
        }),

      removeHistoryItem: (toolId) =>
        set((state) => {
          void syncToolUsageAction("remove-history", toolId)
          return {
            history: state.history.filter((entry) => entry.toolId !== toolId),
          }
        }),

      clearHistory: () => {
        void syncToolUsageAction("clear-history")
        set({ history: [] })
      },
    }),
    {
      name: "tools-usage-storage",
      skipHydration: true,
      version: 1,
    }
  )
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
