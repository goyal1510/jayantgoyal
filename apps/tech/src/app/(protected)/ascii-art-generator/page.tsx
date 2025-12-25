"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function generateASCIIArt(text: string): string {
  // Simple ASCII art generator
  const lines: string[] = []
  const upperText = text.toUpperCase()
  
  // Simple block letters
  const patterns: Record<string, string[]> = {
    A: ["  ##  ", " #  # ", "#### ", "#  # ", "#  # "],
    B: ["###  ", "#  # ", "###  ", "#  # ", "###  "],
    C: [" ### ", "#    ", "#    ", "#    ", " ### "],
    // ... simplified for brevity
  }
  
  // Generate simple ASCII art
  for (let i = 0; i < 5; i++) {
    let line = ""
    for (const char of upperText) {
      if (patterns[char] && patterns[char]![i]) {
        line += patterns[char]![i] + " "
      } else {
        line += char + " "
      }
    }
    lines.push(line)
  }
  
  return lines.join("\n")
}

export default function ASCIIArtGeneratorPage() {
  const tool = getToolByPath("/ascii-art-generator")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }
    setOutput(generateASCIIArt(input))
  }, [input])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("ASCII art copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
            <CardDescription>Enter text to convert</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>ASCII Art</CardTitle>
                <CardDescription>Generated art</CardDescription>
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
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
