"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

function textToBinary(text: string): string {
  return text
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ")
}

function binaryToText(binary: string): string {
  return binary
    .split(/\s+/)
    .map((bin) => {
      try {
        return String.fromCharCode(parseInt(bin, 2))
      } catch {
        return ""
      }
    })
    .join("")
}

export default function TextToASCIIBinaryPage() {
  const tool = getToolByPath("/text-to-ascii-binary")
  const [mode, setMode] = React.useState<"to-binary" | "from-binary">("to-binary")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      if (mode === "to-binary") {
        setOutput(textToBinary(input))
      } else {
        setOutput(binaryToText(input))
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
                variant={mode === "to-binary" ? "default" : "outline"}
                onClick={() => {
                  setMode("to-binary")
                  setOutput("")
                }}
              >
                Text → Binary
              </Button>
              <Button
                variant={mode === "from-binary" ? "default" : "outline"}
                onClick={() => {
                  setMode("from-binary")
                  setOutput("")
                }}
              >
                Binary → Text
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "to-binary" ? "Text Input" : "Binary Input"}</CardTitle>
            <CardDescription>
              {mode === "to-binary" ? "Enter text to convert" : "Enter binary (8-bit groups)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "to-binary" ? "Enter text..." : "01001000 01100101 01101100..."}
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === "to-binary" ? "Binary Output" : "Text Output"}</CardTitle>
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
