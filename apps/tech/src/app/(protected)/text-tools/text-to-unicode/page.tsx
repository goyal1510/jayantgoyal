"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

function textToUnicode(text: string): string {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0)
      return `U+${code.toString(16).toUpperCase().padStart(4, "0")}`
    })
    .join(" ")
}

function unicodeToText(unicode: string): string {
  return unicode
    .split(/\s+/)
    .map((code) => {
      try {
        const hex = code.replace(/^U\+/i, "")
        return String.fromCharCode(parseInt(hex, 16))
      } catch {
        return ""
      }
    })
    .join("")
}

export default function TextToUnicodePage() {
  const tool = getToolByPath("/text-tools/text-to-unicode")
  const [mode, setMode] = React.useState<"to-unicode" | "from-unicode">("to-unicode")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      if (mode === "to-unicode") {
        setOutput(textToUnicode(input))
      } else {
        setOutput(unicodeToText(input))
      }
    } catch {
      setOutput("Conversion failed")
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
                variant={mode === "to-unicode" ? "default" : "outline"}
                onClick={() => {
                  setMode("to-unicode")
                  setOutput("")
                }}
              >
                Text → Unicode
              </Button>
              <Button
                variant={mode === "from-unicode" ? "default" : "outline"}
                onClick={() => {
                  setMode("from-unicode")
                  setOutput("")
                }}
              >
                Unicode → Text
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "to-unicode" ? "Text Input" : "Unicode Input"}</CardTitle>
            <CardDescription>
              {mode === "to-unicode" ? "Enter text to convert" : "Enter Unicode codes (U+XXXX)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "to-unicode" ? "Enter text..." : "U+0048 U+0065 U+006C..."}
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === "to-unicode" ? "Unicode Output" : "Text Output"}</CardTitle>
                <CardDescription>Result</CardDescription>
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
              placeholder="Result will appear here..."
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
