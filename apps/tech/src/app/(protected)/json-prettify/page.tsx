"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

export default function JSONPrettifyPage() {
  const tool = getToolByPath("/json-prettify")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [error, setError] = React.useState("")

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

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
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
    </div>
  )
}
