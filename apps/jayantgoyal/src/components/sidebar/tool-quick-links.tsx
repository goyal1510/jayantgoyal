"use client"

import { Clock, Star } from "lucide-react"
import { allTools } from "@/lib/tools/tools"
import type { Tool } from "@/lib/tools/tools"
import {
  useToolsUsageHydration,
  useToolsUsageStore,
} from "@/lib/tools/use-tools-usage-store"

import { FlyoutItem } from "./flyout-items"
import { getToolColor } from "./tool-colors"

const toolById = new Map(allTools.map((tool) => [tool.id, tool]))

export function ToolQuickLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate: () => void
}) {
  const hasHydrated = useToolsUsageHydration()
  const favoriteToolIds = useToolsUsageStore((state) => state.favoriteToolIds)
  const history = useToolsUsageStore((state) => state.history)

  const favoriteTools = hasHydrated
    ? favoriteToolIds
        .map((toolId) => toolById.get(toolId))
        .filter((tool): tool is Tool => Boolean(tool))
        .slice(0, 5)
    : []
  const historyTools = hasHydrated
    ? history
        .map((entry) => toolById.get(entry.toolId))
        .filter((tool): tool is Tool => Boolean(tool))
        .slice(0, 5)
    : []

  if (favoriteTools.length === 0 && historyTools.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 border-b border-sidebar-border pb-2">
      {favoriteTools.length > 0 && (
        <div>
          <div className="text-sidebar-foreground/70 flex items-center gap-1.5 px-2 py-1 text-xs font-medium">
            <Star className="size-3.5 text-yellow-500" />
            Favorites
          </div>
          {favoriteTools.map((tool) => (
            <FlyoutItem
              key={tool.id}
              href={tool.path}
              icon={tool.icon}
              label={tool.title}
              color={getToolColor(tool.id)}
              isActive={pathname === tool.path}
              onClick={onNavigate}
            />
          ))}
        </div>
      )}
      {historyTools.length > 0 && (
        <div>
          <div className="text-sidebar-foreground/70 flex items-center gap-1.5 px-2 py-1 text-xs font-medium">
            <Clock className="size-3.5 text-blue-500" />
            History
          </div>
          {historyTools.map((tool) => (
            <FlyoutItem
              key={tool.id}
              href={tool.path}
              icon={tool.icon}
              label={tool.title}
              color={getToolColor(tool.id)}
              isActive={pathname === tool.path}
              onClick={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
