"use client"

import * as React from "react"
import Link from "next/link"
import { Clock, Search, Star, Trash2 } from "lucide-react"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { cn } from "@repo/ui/lib/utils"
import {
  allTools,
  getToolCategoryByToolId,
  toolCategories,
  type Tool,
} from "@/lib/tools/tools"
import {
  useToolsUsageHydration,
  useToolsUsageStore,
} from "@/lib/tools/use-tools-usage-store"
import { ToolFavoriteButton } from "@/components/tools/tool-favorite-button"

const toolById = new Map(allTools.map((tool) => [tool.id, tool]))

function ToolCard({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const category = getToolCategoryByToolId(tool.id)
  const Icon = tool.icon

  return (
    <Card className="group relative h-full transition-colors hover:bg-accent">
      <ToolFavoriteButton
        toolId={tool.id}
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2 z-10"
      />
      <Link href={tool.path} className="block h-full pr-9">
        <CardHeader className={cn(compact && "space-y-1 p-4")}>
          <div className="flex items-start gap-3">
            <div className="bg-background grid size-9 shrink-0 place-items-center rounded-md border">
              <Icon className={cn("size-4", category?.color ?? "text-muted-foreground")} />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base leading-tight">{tool.title}</CardTitle>
              {category && (
                <Badge variant="secondary" className="text-[11px]">
                  {category.title}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {!compact && (
          <CardContent>
            <CardDescription>{tool.description}</CardDescription>
          </CardContent>
        )}
      </Link>
    </Card>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="border-border/70 bg-muted/30 flex items-center gap-3 rounded-lg border border-dashed p-4">
      <Icon className="text-muted-foreground size-5 shrink-0" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}

export default function ToolsClient() {
  const [query, setQuery] = React.useState("")
  const hasHydrated = useToolsUsageHydration()
  const favoriteToolIds = useToolsUsageStore((state) => state.favoriteToolIds)
  const history = useToolsUsageStore((state) => state.history)
  const clearHistory = useToolsUsageStore((state) => state.clearHistory)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredCategories = React.useMemo(() => {
    if (!normalizedQuery) return toolCategories

    return toolCategories
      .map((category) => ({
        ...category,
        tools: category.tools.filter((tool) => {
          const haystack = `${tool.title} ${tool.description} ${category.title}`.toLowerCase()
          return haystack.includes(normalizedQuery)
        }),
      }))
      .filter((category) => category.tools.length > 0)
  }, [normalizedQuery])

  const favoriteTools = hasHydrated
    ? favoriteToolIds
        .map((toolId) => toolById.get(toolId))
        .filter((tool): tool is Tool => Boolean(tool))
    : []
  const historyTools = hasHydrated
    ? history
        .map((entry) => toolById.get(entry.toolId))
        .filter((tool): tool is Tool => Boolean(tool))
    : []

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Tech Tools</h1>
            <p className="text-muted-foreground max-w-2xl">
              Search the tool library, pin favorites, and jump back into recently used tools.
            </p>
          </div>
          <div className="relative w-full lg:max-w-md">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground text-sm">Tools</p>
            <p className="text-2xl font-semibold">{allTools.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground text-sm">Favorites</p>
            <p className="text-2xl font-semibold">{hasHydrated ? favoriteTools.length : "-"}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground text-sm">History</p>
            <p className="text-2xl font-semibold">{hasHydrated ? historyTools.length : "-"}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="size-5 text-yellow-500" />
          <h2 className="text-xl font-semibold tracking-tight">Favorites</h2>
        </div>
        {favoriteTools.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} compact />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Star}
            title="No favorites yet"
            description="Use the star button on any tool to keep it here."
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-blue-500" />
            <h2 className="text-xl font-semibold tracking-tight">History</h2>
          </div>
          {historyTools.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="mr-2 size-4" />
              Clear
            </Button>
          )}
        </div>
        {historyTools.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {historyTools.slice(0, 8).map((tool) => (
              <ToolCard key={tool.id} tool={tool} compact />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No history yet"
            description="Open a tool and it will appear here automatically."
          />
        )}
      </section>

      <section className="space-y-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <category.icon className={cn("size-5", category.color)} />
              <h2 className="text-xl font-semibold tracking-tight">{category.title}</h2>
              <Badge variant="secondary">{category.tools.length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {category.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <EmptyState
            icon={Search}
            title="No tools found"
            description="Try another search term."
          />
        )}
      </section>
    </div>
  )
}
