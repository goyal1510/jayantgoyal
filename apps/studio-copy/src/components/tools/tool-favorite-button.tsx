"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { Button } from "@repo/ui/button"
import { cn } from "@repo/ui/lib/utils"
import {
  useToolsUsageHydration,
  useToolsUsageStore,
} from "@/lib/tools/use-tools-usage-store"

interface ToolFavoriteButtonProps {
  toolId: string
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost"
}

export function ToolFavoriteButton({
  toolId,
  className,
  size = "sm",
  variant = "outline",
}: ToolFavoriteButtonProps) {
  const hasHydrated = useToolsUsageHydration()
  const favoriteToolIds = useToolsUsageStore((state) => state.favoriteToolIds)
  const toggleFavorite = useToolsUsageStore((state) => state.toggleFavorite)
  const isFavorite = favoriteToolIds.includes(toolId)

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!hasHydrated}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={cn("shrink-0 gap-2", className)}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleFavorite(toolId)
      }}
    >
      <Star
        className={cn(
          "size-4",
          isFavorite && "fill-yellow-400 text-yellow-500"
        )}
      />
      {size !== "icon" && (
        <span>{isFavorite ? "Favorited" : "Favorite"}</span>
      )}
    </Button>
  )
}
