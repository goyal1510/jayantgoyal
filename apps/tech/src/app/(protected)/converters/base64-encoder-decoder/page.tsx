"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

export default function Base64EncoderDecoderPage() {
  const tool = getToolByPath("/converters/base64-encoder-decoder")
  const [mode, setMode] = React.useState<"encode" | "decode">("encode")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  const convert = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      if (mode === "encode") {
        const encoded = btoa(unescape(encodeURIComponent(input)))
        setOutput(encoded)
      } else {
        try {
          const decoded = decodeURIComponent(escape(atob(input)))
          setOutput(decoded)
        } catch {
          setOutput("Invalid Base64 string")
        }
      }
    } catch (error) {
      setOutput("Conversion failed")
    }
  }, [input, mode])

  React.useEffect(() => {
    convert()
  }, [convert])

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
                variant={mode === "encode" ? "default" : "outline"}
                onClick={() => {
                  setMode("encode")
                  setOutput("")
                }}
              >
                Encode
              </Button>
              <Button
                variant={mode === "decode" ? "default" : "outline"}
                onClick={() => {
                  setMode("decode")
                  setOutput("")
                }}
              >
                Decode
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "encode" ? "Plain Text" : "Base64 String"}</CardTitle>
            <CardDescription>
              {mode === "encode" ? "Enter text to encode" : "Enter Base64 to decode"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "encode" ? "Enter text..." : "Enter Base64..."}
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === "encode" ? "Base64 Encoded" : "Decoded Text"}</CardTitle>
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
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
