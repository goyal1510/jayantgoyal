"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function jsonToXml(obj: any, rootTag: string = "root"): string {
  function escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  function valueToXml(value: any, tag: string, indent: number = 0): string {
    const spaces = "  ".repeat(indent)
    
    if (value === null || value === undefined) {
      return `${spaces}<${tag}></${tag}>\n`
    }
    
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.map((item, index) => 
          valueToXml(item, tag, indent)
        ).join("")
      } else {
        let xml = `${spaces}<${tag}>\n`
        Object.entries(value).forEach(([key, val]) => {
          xml += valueToXml(val, key, indent + 1)
        })
        xml += `${spaces}</${tag}>\n`
        return xml
      }
    }
    
    return `${spaces}<${tag}>${escapeXml(String(value))}</${tag}>\n`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${valueToXml(obj, rootTag)}`
}

export default function JSONToXMLPage() {
  const tool = getToolByPath("/converters/json-to-xml")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [error, setError] = React.useState("")
  const [rootTag, setRootTag] = React.useState("root")

  const convert = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = JSON.parse(input)
      const xml = jsonToXml(parsed, rootTag)
      setOutput(xml)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON")
      setOutput("")
    }
  }, [input, rootTag])

  React.useEffect(() => {
    convert()
  }, [convert])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("XML copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="root-tag">Root Tag Name</Label>
            <input
              id="root-tag"
              type="text"
              value={rootTag}
              onChange={(e) => setRootTag(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              placeholder="root"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
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
                <CardTitle>XML Output</CardTitle>
                <CardDescription>Converted XML</CardDescription>
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
              placeholder="XML will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
