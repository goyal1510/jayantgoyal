"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { cn } from "@repo/ui/lib/utils"
import { Clock3, FolderOpen, Search, Star, Workflow } from "lucide-react"
import { SAFE_SAVED_TOOL_IDS } from "@/lib/tools/persistence"
import { allTools, toolCategories, type Tool } from "@/lib/tools/tools"

const FAVORITES_KEY = "jg.toolFavorites"
const RECENTS_KEY = "jg.toolRecents"
const MAX_RECENTS = 8

type ToolWithCategory = Tool & {
  categoryId: string
  categoryTitle: string
}

function readStringList(key: string) {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]")
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function writeStringList(key: string, value: string[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const toolRows: ToolWithCategory[] = toolCategories.flatMap((category) =>
  category.tools.map((tool) => ({
    ...tool,
    categoryId: category.id,
    categoryTitle: category.title,
  }))
)

export default function ToolsPageClient() {
  const [query, setQuery] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([])
  const [recentIds, setRecentIds] = React.useState<string[]>([])

  React.useEffect(() => {
    setFavoriteIds(readStringList(FAVORITES_KEY))
    setRecentIds(readStringList(RECENTS_KEY))
  }, [])

  const favoriteTools = React.useMemo(
    () => favoriteIds.map((id) => allTools.find((tool) => tool.id === id)).filter(Boolean) as Tool[],
    [favoriteIds]
  )
  const recentTools = React.useMemo(
    () => recentIds.map((id) => allTools.find((tool) => tool.id === id)).filter(Boolean) as Tool[],
    [recentIds]
  )

  const filteredTools = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return toolRows.filter((tool) => {
      const matchesCategory = activeCategory === "all" || tool.categoryId === activeCategory
      const matchesQuery =
        !normalizedQuery ||
        tool.title.toLowerCase().includes(normalizedQuery) ||
        tool.description.toLowerCase().includes(normalizedQuery) ||
        tool.categoryTitle.toLowerCase().includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, query])

  function toggleFavorite(toolId: string) {
    setFavoriteIds((current) => {
      const next = current.includes(toolId)
        ? current.filter((id) => id !== toolId)
        : [toolId, ...current]
      writeStringList(FAVORITES_KEY, next)
      return next
    })
  }

  function recordRecent(toolId: string) {
    setRecentIds((current) => {
      const next = [toolId, ...current.filter((id) => id !== toolId)].slice(0, MAX_RECENTS)
      writeStringList(RECENTS_KEY, next)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Tools Workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tech Tools</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Search, favorite, resume recent utilities, and save cloud history for safe formatter workflows.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/tools/workspace">
                <Workflow className="size-4" />
                Open workspace
              </Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Tools" value={allTools.length} />
            <Metric label="Categories" value={toolCategories.length} />
            <Metric label="Favorites" value={favoriteIds.length} />
            <Metric label="Cloud-save ready" value={SAFE_SAVED_TOOL_IDS.size} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="size-4 text-muted-foreground" />
              Resume Work
            </CardTitle>
            <CardDescription>Local recents and favorites stay on this browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickToolList
              title="Recent"
              empty="Open a tool and it will appear here."
              tools={recentTools}
              onOpen={recordRecent}
            />
            <QuickToolList
              title="Favorites"
              empty="Star tools you use often."
              tools={favoriteTools.slice(0, 5)}
              onOpen={recordRecent}
            />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools by name, category, or use case"
              className="pl-9"
              aria-label="Search tools"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-[56%]">
            <CategoryButton
              label="All"
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {toolCategories.map((category) => (
              <CategoryButton
                key={category.id}
                label={category.title}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Browse Tools</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTools.length} tools match the current view.
          </p>
        </div>
        {(query || activeCategory !== "all") && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("")
              setActiveCategory("all")
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {filteredTools.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FolderOpen className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No tools found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={favoriteIds.includes(tool.id)}
              canSave={SAFE_SAVED_TOOL_IDS.has(tool.id)}
              onToggleFavorite={() => toggleFavorite(tool.id)}
              onOpen={() => recordRecent(tool.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className="shrink-0"
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function QuickToolList({
  title,
  empty,
  tools,
  onOpen,
}: {
  title: string
  empty: string
  tools: Tool[]
  onOpen: (toolId: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
      {tools.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.id}
                href={tool.path}
                onClick={() => onOpen(tool.id)}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate">{tool.title}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ToolCard({
  tool,
  isFavorite,
  canSave,
  onToggleFavorite,
  onOpen,
}: {
  tool: ToolWithCategory
  isFavorite: boolean
  canSave: boolean
  onToggleFavorite: () => void
  onOpen: () => void
}) {
  const Icon = tool.icon

  return (
    <Card className="h-full min-w-0 transition-colors hover:bg-accent/50">
      <CardHeader className="min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Link href={tool.path} onClick={onOpen} className="min-w-0 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </span>
            <span className="min-w-0">
              <CardTitle className="truncate text-lg">{tool.title}</CardTitle>
              <span className="mt-1 block text-xs text-muted-foreground">{tool.categoryTitle}</span>
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? `Remove ${tool.title} from favorites` : `Add ${tool.title} to favorites`}
            title={isFavorite ? "Remove favorite" : "Add favorite"}
          >
            <Star className={cn("size-4", isFavorite && "fill-amber-400 text-amber-500")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <CardDescription className="break-words">{tool.description}</CardDescription>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{tool.categoryTitle}</Badge>
          {canSave && <Badge>Cloud history</Badge>}
        </div>
        <Button asChild variant="outline" className="w-full min-w-0 max-w-full">
          <Link href={tool.path} onClick={onOpen}>
            Open tool
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
