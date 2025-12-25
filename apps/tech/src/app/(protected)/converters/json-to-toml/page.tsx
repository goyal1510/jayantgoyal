"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function jsonToToml(obj: any, prefix: string = ""): string {
  let toml = ""
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      toml += `[${fullKey}]\n`
      toml += jsonToToml(value, fullKey)
    } else {
      const tomlValue = valueToToml(value)
      toml += `${key} = ${tomlValue}\n`
    }
  })
  
  return toml
}

function valueToToml(value: any): string {
  if (value === null) return "null"
  if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) {
    return `[${value.map(valueToToml).join(", ")}]`
  }
  return String(value)
}

export default function JSONToTOMLPage() {
  const tool = getToolByPath("/converters/json-to-toml")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [error, setError] = React.useState("")

  const convert = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = JSON.parse(input)
      const toml = jsonToToml(parsed)
      setOutput(toml)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON")
      setOutput("")
    }
  }, [input])

  React.useEffect(() => {
    convert()
  }, [convert])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("TOML copied to clipboard")
  }
  
  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>JSON Input</CardTitle>
            <CardDescription>Enter or paste JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
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
                <CardTitle>TOML Output</CardTitle>
                <CardDescription>Converted TOML</CardDescription>
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
              placeholder="TOML will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
