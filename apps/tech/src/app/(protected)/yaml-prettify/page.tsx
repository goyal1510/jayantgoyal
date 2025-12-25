"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function prettifyYAML(yaml: string): string {
  // Simple YAML prettifier - ensures consistent indentation
  const lines = yaml.split("\n")
  const formatted: string[] = []
  let indentLevel = 0

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      if (trimmed) formatted.push("  ".repeat(indentLevel) + trimmed)
      return
    }

    // Adjust indent level based on list items
    if (trimmed.startsWith("- ")) {
      formatted.push("  ".repeat(indentLevel) + trimmed)
      indentLevel++
    } else {
      const colonIndex = trimmed.indexOf(":")
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim()
        const value = trimmed.slice(colonIndex + 1).trim()
        
        if (value === "" || value === "{}" || value === "[]") {
          formatted.push("  ".repeat(indentLevel) + `${key}:`)
          indentLevel++
        } else {
          formatted.push("  ".repeat(indentLevel) + `${key}: ${value}`)
        }
      } else {
        formatted.push("  ".repeat(indentLevel) + trimmed)
      }
    }
  })

  return formatted.join("\n")
}

export default function YAMLPrettifyPage() {
  const tool = getToolByPath("/yaml-prettify")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  const prettify = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      const formatted = prettifyYAML(input)
      setOutput(formatted)
    } catch (error) {
      setOutput("Failed to prettify YAML")
    }
  }, [input])

  React.useEffect(() => {
    prettify()
  }, [prettify])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Prettified YAML copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>YAML Input</CardTitle>
            <CardDescription>Enter or paste YAML to prettify</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="key: value"
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Prettified YAML</CardTitle>
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
              placeholder="Prettified YAML will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
