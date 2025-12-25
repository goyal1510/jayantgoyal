"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function obfuscateString(text: string, keepStart: number = 2, keepEnd: number = 2): string {
  if (text.length <= keepStart + keepEnd) {
    return "*".repeat(text.length)
  }
  
  const start = text.slice(0, keepStart)
  const end = text.slice(-keepEnd)
  const middle = "*".repeat(Math.max(4, text.length - keepStart - keepEnd))
  
  return `${start}${middle}${end}`
}

export default function StringObfuscatorPage() {
  const tool = getToolByPath("/string-obfuscator")
  const [input, setInput] = React.useState("")
  const [keepStart, setKeepStart] = React.useState(2)
  const [keepEnd, setKeepEnd] = React.useState(2)
  const [output, setOutput] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }
    setOutput(obfuscateString(input, keepStart, keepEnd))
  }, [input, keepStart, keepEnd])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Obfuscated string copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure obfuscation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">String to Obfuscate</Label>
              <Input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter string..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keep-start">Keep Start Characters</Label>
                <Input
                  id="keep-start"
                  type="number"
                  min="0"
                  max="10"
                  value={keepStart}
                  onChange={(e) => setKeepStart(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keep-end">Keep End Characters</Label>
                <Input
                  id="keep-end"
                  type="number"
                  min="0"
                  max="10"
                  value={keepEnd}
                  onChange={(e) => setKeepEnd(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Obfuscated String</CardTitle>
                <CardDescription>Safe to share</CardDescription>
              </div>
              {output && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Input
              value={output}
              readOnly
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Useful for sharing secrets, tokens, or sensitive data without revealing the full value
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
