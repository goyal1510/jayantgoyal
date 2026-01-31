"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Button } from "@repo/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function xmlToJson(xml: string): string {
  try {
    // Simple XML to JSON converter
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, "text/xml")

    const parseError = xmlDoc.querySelector("parsererror")
    if (parseError) {
      throw new Error("Invalid XML")
    }

    function nodeToJson(node: Node): unknown {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        return text || null
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const result: Record<string, unknown> = {}

        // Attributes
        if (element.attributes.length > 0) {
          const attrs: Record<string, string> = {}
          Array.from(element.attributes).forEach((attr) => {
            attrs[attr.name] = attr.value
          })
          result["@attributes"] = attrs
        }

        // Children
        const children: Record<string, unknown[]> = {}
        Array.from(element.childNodes).forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child as Element
            const tagName = childElement.tagName
            if (!children[tagName]) {
              children[tagName] = []
            }
            children[tagName].push(nodeToJson(child))
          } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
            result["#text"] = child.textContent.trim()
          }
        })

        // Merge children
        Object.entries(children).forEach(([key, value]) => {
          result[key] = value.length === 1 ? value[0] : value
        })

        return result
      }

      return null
    }

    const json = nodeToJson(xmlDoc.documentElement)
    return JSON.stringify(json, null, 2)
  } catch {
    throw new Error("Failed to parse XML")
  }
}

export default function XMLToJSONClient() {
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
      const json = xmlToJson(input)
      setOutput(json)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid XML")
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>XML Input</CardTitle>
            <CardDescription>Enter or paste XML</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='<root><item>value</item></root>'
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
