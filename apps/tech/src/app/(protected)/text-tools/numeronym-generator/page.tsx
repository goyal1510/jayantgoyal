"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function generateNumeronym(word: string): string {
  const trimmed = word.trim()
  if (trimmed.length <= 3) return trimmed
  
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  const middle = trimmed.length - 2
  
  return `${first}${middle}${last}`
}

export default function NumeronymGeneratorPage() {
  const tool = getToolByPath("/text-tools/numeronym-generator")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    const words = input.split(/\s+/)
    const numeronyms = words.map(word => generateNumeronym(word))
    setOutput(numeronyms.join(" "))
  }, [input])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Numeronym copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
            <CardDescription>Enter word(s) to convert</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., internationalization"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Example: "internationalization" becomes "i18n"
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Numeronym</CardTitle>
                <CardDescription>Generated abbreviation</CardDescription>
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
              className="font-mono text-lg"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
