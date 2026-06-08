"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Button } from "@repo/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import { ToolBulkJsonPanel } from "@/components/tools/tool-bulk-json-panel"
import { ToolWorkspacePanel } from "@/components/tools/tool-workspace-panel"

const DRAFT_KEY = "jg-tool-draft:json-prettify"

export default function JSONPrettifyClient() {
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const draft = window.localStorage.getItem(DRAFT_KEY)
    if (draft) {
      setInput(draft)
    }
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, input)
  }, [input])

  const prettify = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = JSON.parse(input)
      const prettified = JSON.stringify(parsed, null, 2)
      setOutput(prettified)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON")
      setOutput("")
    }
  }, [input])

  React.useEffect(() => {
    prettify()
  }, [prettify])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input JSON</CardTitle>
            <CardDescription>Enter or paste JSON to prettify</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"key":"value"}'
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Prettified JSON</CardTitle>
                <CardDescription>Formatted output</CardDescription>
              </div>
              {output && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={output}
              readOnly
              placeholder="Prettified JSON will appear here..."
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>

      <ToolWorkspacePanel
        toolId="json-prettify"
        toolName="JSON Prettify"
        inputPayload={{ text: input }}
        outputPayload={{ text: output }}
        canSave={Boolean(output && !error)}
        onRestore={(item) => {
          const payload = item.input_payload as { text?: unknown } | null
          if (payload && typeof payload.text === "string") {
            setInput(payload.text)
            toast.success("Restored saved JSON")
          }
        }}
      />

      <ToolBulkJsonPanel toolId="json-prettify" actionLabel="Prettify batch" />
    </div>
  )
}
