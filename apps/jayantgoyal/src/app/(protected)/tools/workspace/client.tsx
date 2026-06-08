"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Download, FolderOpen, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface SavedToolItem {
  id: string
  tool_id: string
  title: string
  input_payload: unknown
  output_payload: unknown
  metadata: {
    collection?: string
    isFavorite?: boolean
    [key: string]: unknown
  }
  created_at: string
  updated_at: string
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatToolLabel(toolId: string) {
  return toolId.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

export default function ToolWorkspacePageClient() {
  const [items, setItems] = React.useState<SavedToolItem[]>([])
  const [collectionDrafts, setCollectionDrafts] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(true)

  const loadItems = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tools/saved", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load tool workspace")
      }
      const savedItems = payload.savedItems ?? []
      setItems(savedItems)
      setCollectionDrafts(
        Object.fromEntries(
          savedItems.map((item: SavedToolItem) => [item.id, item.metadata?.collection ?? ""])
        )
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load tool workspace")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadItems()
  }, [loadItems])

  const updateItem = async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch(`/api/tools/saved/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.error || "Unable to update saved item")
    }
    setItems((current) => current.map((item) => (item.id === id ? payload.savedItem : item)))
  }

  const toggleFavorite = async (item: SavedToolItem) => {
    try {
      await updateItem(item.id, { isFavorite: !item.metadata?.isFavorite })
      toast.success(item.metadata?.isFavorite ? "Removed favorite" : "Marked favorite")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update favorite")
    }
  }

  const saveCollection = async (item: SavedToolItem, collection: string) => {
    try {
      await updateItem(item.id, { collection })
      toast.success("Collection updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update collection")
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/tools/saved/${id}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete saved item")
      }
      setItems((current) => current.filter((item) => item.id !== id))
      toast.success("Saved item deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete saved item")
    }
  }

  const favorites = items.filter((item) => item.metadata?.isFavorite)
  const collections = items.reduce<Record<string, SavedToolItem[]>>((acc, item) => {
    const key = item.metadata?.collection || "Unsorted"
    acc[key] = [...(acc[key] ?? []), item]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tool Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Saved outputs from safe tools, grouped into collections and favorites.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/tools">Browse tools</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{items.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Favorites</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{favorites.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collections</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{Object.keys(collections).length}</CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading workspace...
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Save safe formatter output to build your workspace.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(collections).map(([collection, collectionItems]) => (
            <section key={collection} className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-medium">{collection}</h2>
              </div>
              <div className="grid gap-3">
                {collectionItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          {item.metadata?.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
                          <div className="truncate font-medium">{item.title}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatToolLabel(item.tool_id)} · {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <form
                          className="flex min-w-0 gap-2"
                          onSubmit={(event) => {
                            event.preventDefault()
                            const formData = new FormData(event.currentTarget)
                            void saveCollection(item, String(formData.get("collection") ?? ""))
                          }}
                        >
                          <input
                            name="collection"
                            value={collectionDrafts[item.id] ?? ""}
                            onChange={(event) => setCollectionDrafts((drafts) => ({
                              ...drafts,
                              [item.id]: event.target.value,
                            }))}
                            placeholder="Collection"
                            className="h-9 min-w-0 rounded-md border border-input bg-transparent px-3 text-sm"
                          />
                          <Button type="submit" variant="outline" size="sm">
                            Save group
                          </Button>
                        </form>
                        <Button type="button" variant="ghost" size="icon" onClick={() => toggleFavorite(item)} aria-label={`Favorite ${item.title}`}>
                          <Star className={item.metadata?.isFavorite ? "h-4 w-4 fill-amber-400 text-amber-500" : "h-4 w-4"} />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => downloadJson(`${item.tool_id}-${item.id}.json`, item)} aria-label={`Export ${item.title}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => deleteItem(item.id)} aria-label={`Delete ${item.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
