"use client"

import * as React from "react"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Download, History, RotateCcw, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface SavedToolItem {
  id: string
  title: string
  input_payload: unknown
  output_payload: unknown
  created_at: string
}

interface ToolWorkspacePanelProps {
  toolId: string
  toolName: string
  inputPayload: unknown
  outputPayload: unknown
  canSave: boolean
  onRestore?: (item: SavedToolItem) => void
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

export function ToolWorkspacePanel({
  toolId,
  toolName,
  inputPayload,
  outputPayload,
  canSave,
  onRestore,
}: ToolWorkspacePanelProps) {
  const [title, setTitle] = React.useState("")
  const [savedItems, setSavedItems] = React.useState<SavedToolItem[]>([])
  const [limit, setLimit] = React.useState<number | null>(null)
  const [plan, setPlan] = React.useState<string>("free")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadSavedItems = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tools/saved?toolId=${encodeURIComponent(toolId)}`)
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load saved history")
      }
      setSavedItems(payload.savedItems ?? [])
      setLimit(payload.access?.limit ?? null)
      setPlan(payload.access?.plan ?? "free")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load saved history")
    } finally {
      setIsLoading(false)
    }
  }, [toolId])

  React.useEffect(() => {
    void loadSavedItems()
  }, [loadSavedItems])

  const saveCurrent = async () => {
    if (!canSave) {
      toast.error("Generate valid output before saving")
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch("/api/tools/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          title: title || `${toolName} ${new Date().toLocaleString()}`,
          inputPayload,
          outputPayload,
          metadata: { source: "tool-workspace-panel" },
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save item")
      }
      setSavedItems((items) => [payload.savedItem, ...items])
      setTitle("")
      toast.success("Saved to workspace")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save item")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/tools/saved/${id}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete item")
      }
      setSavedItems((items) => items.filter((item) => item.id !== id))
      toast.success("Removed saved item")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete item")
    }
  }

  const exportCurrent = () => {
    if (!canSave) {
      toast.error("Generate valid output before exporting")
      return
    }
    downloadJson(`${toolId}-${Date.now()}.json`, {
      toolId,
      input: inputPayload,
      output: outputPayload,
      exportedAt: new Date().toISOString(),
    })
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Workspace</CardTitle>
          </div>
          <div className="text-xs text-muted-foreground">
            {savedItems.length}
            {limit !== null ? `/${limit}` : ""} saved · {plan}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Save title"
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveCurrent} disabled={isSaving || !canSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={exportCurrent} disabled={!canSave}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            Loading saved items...
          </div>
        ) : savedItems.length === 0 ? (
          <div className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            No saved items yet.
          </div>
        ) : (
          <div className="space-y-2">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {onRestore && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRestore(item)}
                      aria-label={`Restore ${item.title}`}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadJson(`${toolId}-${item.id}.json`, item)}
                    aria-label={`Export ${item.title}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
