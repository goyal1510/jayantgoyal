"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function tomlToJson(toml: string): string {
  try {
    const result: Record<string, any> = {}
    const lines = toml.split("\n")
    let currentSection: Record<string, any> = result
    
    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) return
      
      // Section header [section.name]
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const sectionPath = trimmed.slice(1, -1).split(".")
        currentSection = result
        sectionPath.forEach((part, index) => {
          if (!currentSection[part]) {
            currentSection[part] = {}
          }
          if (index === sectionPath.length - 1) {
            currentSection = currentSection[part] as Record<string, any>
          } else {
            currentSection = currentSection[part] as Record<string, any>
          }
        })
        return
      }
      
      // Key = value
      const equalIndex = trimmed.indexOf("=")
      if (equalIndex > 0) {
        const key = trimmed.slice(0, equalIndex).trim()
        const value = trimmed.slice(equalIndex + 1).trim()
        currentSection[key] = parseTomlValue(value)
      }
    })
    
    return JSON.stringify(result, null, 2)
  } catch {
    throw new Error("Failed to parse TOML")
  }
}

function parseTomlValue(value: string): any {
  const trimmed = value.trim()
  
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"')
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  if (trimmed === "null") return null
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const items = trimmed.slice(1, -1).split(",").map(s => parseTomlValue(s.trim()))
    return items
  }
  if (!isNaN(Number(trimmed))) {
    return Number(trimmed)
  }
  
  return trimmed
}

export default function TOMLToJSONPage() {
  const tool = getToolByPath("/converters/toml-to-json")
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
      const json = tomlToJson(input)
      setOutput(json)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid TOML")
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
            <CardTitle>TOML Input</CardTitle>
            <CardDescription>Enter or paste TOML</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="key = value"
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
