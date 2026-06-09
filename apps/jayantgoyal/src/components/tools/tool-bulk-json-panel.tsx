"use client"

import * as React from "react"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Label } from "@repo/ui/label"
import { Download, Layers3, Play } from "lucide-react"
import { toast } from "sonner"

interface BulkResult {
  index: number
  input: string
  ok: boolean
  output: string
  error?: string
}

interface ToolBulkJsonPanelProps {
  toolId: string
  actionLabel: string
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

export function ToolBulkJsonPanel({ toolId, actionLabel }: ToolBulkJsonPanelProps) {
  const [rawItems, setRawItems] = React.useState("")
  const [results, setResults] = React.useState<BulkResult[]>([])
  const [limit, setLimit] = React.useState<number | null>(null)
  const [plan, setPlan] = React.useState("free")
  const [isProcessing, setIsProcessing] = React.useState(false)

  const items = React.useMemo(
    () => rawItems.split("\n").map((item) => item.trim()).filter(Boolean),
    [rawItems]
  )

  const processItems = async () => {
    if (items.length === 0) {
      toast.error("Add one JSON document per line")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/tools/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, items }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to process bulk items")
      }
      setResults(payload.results ?? [])
      setLimit(payload.access?.limit ?? null)
      setPlan(payload.access?.plan ?? "free")
      toast.success("Bulk processing complete")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process bulk items")
    } finally {
      setIsProcessing(false)
    }
  }

  const exportResults = () => {
    if (results.length === 0) {
      toast.error("Run a batch before exporting")
      return
    }
    downloadJson(`${toolId}-bulk-${Date.now()}.json`, {
      toolId,
      results,
      exportedAt: new Date().toISOString(),
    })
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Bulk JSON</CardTitle>
          </div>
          <div className="text-xs text-muted-foreground">
            {items.length}
            {limit !== null ? `/${limit}` : ""} queued · {plan}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" size="sm" onClick={processItems} disabled={isProcessing}>
            <Play className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={exportResults} disabled={results.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export batch
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${toolId}-bulk-json-input`}>
            JSON documents
          </Label>
          <textarea
            id={`${toolId}-bulk-json-input`}
            name="bulk-json-input"
            value={rawItems}
            onChange={(event) => setRawItems(event.target.value)}
            placeholder='{"id":1}\n{"id":2}'
            className="min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm"
          />
        </div>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result) => (
              <div key={result.index} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Item {result.index + 1}</span>
                  <span>{result.ok ? "Ready" : "Invalid"}</span>
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                  {result.ok ? result.output : result.error}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
