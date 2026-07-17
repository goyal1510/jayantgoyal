"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Badge } from "@repo/ui/badge"
import { cn } from "@repo/ui/lib/utils"
import {
  getToolByPath,
  getToolCategoryByPath,
} from "@/lib/tools/tools"
import {
  useToolsUsageHydration,
  useToolsUsageStore,
} from "@/lib/tools/use-tools-usage-store"
import { ToolFavoriteButton } from "./tool-favorite-button"

interface ToolUsageShellProps {
  children: React.ReactNode
}

export function ToolUsageShell({ children }: ToolUsageShellProps) {
  const pathname = usePathname()
  const hasHydrated = useToolsUsageHydration()
  const recordVisit = useToolsUsageStore((state) => state.recordVisit)
  const tool = getToolByPath(pathname)
  const category = getToolCategoryByPath(pathname)

  React.useEffect(() => {
    if (hasHydrated && tool) {
      recordVisit(tool.id)
    }
  }, [hasHydrated, recordVisit, tool])

  if (!tool || !category) {
    return <>{children}</>
  }

  return (
    <div className="space-y-6">
      <div className="border-border/70 bg-card/70 flex flex-col gap-4 rounded-lg border px-4 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-muted mt-0.5 grid size-10 shrink-0 place-items-center rounded-md">
            <tool.icon className={cn("size-5", category.color)} />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/tools"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
              >
                <ChevronLeft className="size-4" />
                Tools
              </Link>
              <Badge variant="secondary">{category.title}</Badge>
            </div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {tool.title}
            </h1>
            <p className="text-muted-foreground max-w-3xl text-sm">
              {tool.description}
            </p>
          </div>
        </div>

        <ToolFavoriteButton toolId={tool.id} />
      </div>

      {children}
    </div>
  )
}
