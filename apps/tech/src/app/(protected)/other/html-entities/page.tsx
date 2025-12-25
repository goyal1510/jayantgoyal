"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

const htmlEntities: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&apos;",
}

const entityToChar: Record<string, string> = Object.fromEntries(
  Object.entries(htmlEntities).map(([char, entity]) => [entity, char])
)

function escapeHTML(text: string): string {
  return text.replace(/[<>&"']/g, (char) => htmlEntities[char] || char)
}

function unescapeHTML(text: string): string {
  return text.replace(/&[a-z]+;/gi, (entity) => entityToChar[entity] || entity)
}

export default function HTMLEntitiesPage() {
  const tool = getToolByPath("/other/html-entities")
  const [mode, setMode] = React.useState<"escape" | "unescape">("escape")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    if (mode === "escape") {
      setOutput(escapeHTML(input))
    } else {
      setOutput(unescapeHTML(input))
    }
  }, [input, mode])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mode</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={mode === "escape" ? "default" : "outline"}
                onClick={() => setMode("escape")}
              >
                Escape
              </Button>
              <Button
                variant={mode === "unescape" ? "default" : "outline"}
                onClick={() => setMode("unescape")}
              >
                Unescape
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "escape" ? "Input" : "Escaped Input"}</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "escape" ? "Enter text..." : "Enter HTML entities..."}
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{mode === "escape" ? "Escaped Output" : "Unescaped Output"}</CardTitle>
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
              placeholder="Result will appear here..."
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
