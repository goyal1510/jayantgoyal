"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function tomlToYaml(toml: string): string {
  // Convert TOML to JSON first, then JSON to YAML
  try {
    const result: Record<string, any> = {}
    const lines = toml.split("\n")
    let currentSection: Record<string, any> = result
    
    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) return
      
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
      
      const equalIndex = trimmed.indexOf("=")
      if (equalIndex > 0) {
        const key = trimmed.slice(0, equalIndex).trim()
        const value = trimmed.slice(equalIndex + 1).trim()
        currentSection[key] = parseTomlValue(value)
      }
    })
    
    return jsonToYaml(result)
  } catch {
    throw new Error("Failed to parse TOML")
  }
}

function parseTomlValue(value: string): any {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"')
  }
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  if (trimmed === "null") return null
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map(s => parseTomlValue(s.trim()))
  }
  if (!isNaN(Number(trimmed))) {
    return Number(trimmed)
  }
  return trimmed
}

function jsonToYaml(obj: any, indent: number = 0): string {
  let yaml = ""
  const spaces = "  ".repeat(indent)

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        yaml += `${spaces}- ` + jsonToYaml(item, indent + 1).trim() + "\n"
      } else {
        yaml += `${spaces}- ${stringifyValue(item)}\n`
      }
    })
  } else if (typeof obj === "object" && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`
      } else {
        yaml += `${spaces}${key}: ${stringifyValue(value)}\n`
      }
    })
  }

  return yaml
}

function stringifyValue(value: any): string {
  if (value === null) return "null"
  if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`
  return String(value)
}

export default function TOMLToYAMLPage() {
  const tool = getToolByPath("/toml-to-yaml")
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
      const yaml = tomlToYaml(input)
      setOutput(yaml)
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
    toast.success("YAML copied to clipboard")
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
                <CardTitle>YAML Output</CardTitle>
                <CardDescription>Converted YAML</CardDescription>
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
              placeholder="YAML will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
