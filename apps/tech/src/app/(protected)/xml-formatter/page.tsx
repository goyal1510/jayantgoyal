"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function formatXML(xml: string): string {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, "text/xml")
    
    const parseError = xmlDoc.querySelector("parsererror")
    if (parseError) {
      throw new Error("Invalid XML")
    }

    function formatNode(node: Node, indent: number = 0): string {
      const spaces = "  ".repeat(indent)
      let result = ""

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tagName = element.tagName
        const attributes = Array.from(element.attributes)
          .map(attr => ` ${attr.name}="${attr.value}"`)
          .join("")
        
        const children = Array.from(element.childNodes).filter(
          child => child.nodeType === Node.ELEMENT_NODE || (child.nodeType === Node.TEXT_NODE && child.textContent?.trim())
        )

        if (children.length === 0) {
          result += `${spaces}<${tagName}${attributes} />\n`
        } else {
          result += `${spaces}<${tagName}${attributes}>\n`
          
          children.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
              result += `${spaces}  ${child.textContent.trim()}\n`
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              result += formatNode(child, indent + 1)
            }
          })
          
          result += `${spaces}</${tagName}>\n`
        }
      }

      return result
    }

    return formatNode(xmlDoc.documentElement)
  } catch (error) {
    throw new Error("Failed to format XML")
  }
}

export default function XMLFormatterPage() {
  const tool = getToolByPath("/xml-formatter")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [error, setError] = React.useState("")

  const format = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const formatted = formatXML(input)
      setOutput(formatted)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid XML")
      setOutput("")
    }
  }, [input])

  React.useEffect(() => {
    format()
  }, [format])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Formatted XML copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>XML Input</CardTitle>
            <CardDescription>Enter or paste XML to format</CardDescription>
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
                <CardTitle>Formatted XML</CardTitle>
                <CardDescription>Prettified output</CardDescription>
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
              placeholder="Formatted XML will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
