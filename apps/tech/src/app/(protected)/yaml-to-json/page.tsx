"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

// Simple YAML to JSON converter (basic implementation)
function yamlToJson(yaml: string): string {
  try {
    // This is a simplified converter - for production use a proper YAML parser
    const lines = yaml.split("\n")
    const result: Record<string, any> = {}
    const stack: Array<Record<string, any>> = [result]
    let currentIndent = 0

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) return

      const indent = line.length - line.trimStart().length
      const indentLevel = Math.floor(indent / 2)

      // Adjust stack based on indent
      while (stack.length > indentLevel + 1) {
        stack.pop()
      }

      const current = stack[stack.length - 1]
      if (!current || typeof current !== "object") {
        // Skip invalid entries
      } else if (trimmed.startsWith("- ")) {
        // Array item
        const value = trimmed.slice(2).trim()
        if (!Array.isArray(current)) {
          // Convert to array
          const keys = Object.keys(current)
          if (keys.length > 0) {
            const key = keys[0]
            if (key) {
              current[key] = []
            }
          }
        }
      } else {
        const colonIndex = trimmed.indexOf(":")
        if (colonIndex > 0) {
          const key = trimmed.slice(0, colonIndex).trim()
          const value = trimmed.slice(colonIndex + 1).trim()
          
          if (value === "" || value === "{}" || value === "[]") {
            current[key] = value === "[]" ? [] : {}
            if (typeof current[key] === "object" && current[key] !== null && !Array.isArray(current[key])) {
              stack.push(current[key] as Record<string, any>)
            }
          } else {
            // Try to parse value
            let parsedValue: any = value
            if (value.startsWith('"') && value.endsWith('"')) {
              parsedValue = value.slice(1, -1)
            } else if (value === "true") {
              parsedValue = true
            } else if (value === "false") {
              parsedValue = false
            } else if (value === "null") {
              parsedValue = null
            } else if (!isNaN(Number(value))) {
              parsedValue = Number(value)
            }
            current[key] = parsedValue
          }
        }
      }
    })

    return JSON.stringify(result, null, 2)
  } catch (error) {
    throw new Error("Failed to parse YAML")
  }
}

export default function YAMLToJSONPage() {
  const tool = getToolByPath("/yaml-to-json")
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
      const json = yamlToJson(input)
      setOutput(json)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid YAML")
      setOutput("")
    }
  }, [input])

  React.useEffect(() => {
    convert()
  }, [convert])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("JSON copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>YAML Input</CardTitle>
            <CardDescription>Enter or paste YAML</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="key: value"
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
                <CardTitle>JSON Output</CardTitle>
                <CardDescription>Converted JSON</CardDescription>
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
              placeholder="JSON will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
