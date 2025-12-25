"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function convertBase(value: string, fromBase: number, toBase: number): string {
  try {
    // Convert to decimal first
    const decimal = parseInt(value, fromBase)
    if (isNaN(decimal)) return "Invalid input"
    
    // Convert from decimal to target base
    return decimal.toString(toBase).toUpperCase()
  } catch {
    return "Conversion failed"
  }
}

export default function IntegerBaseConverterPage() {
  const tool = getToolByPath("/integer-base-converter")
  const [input, setInput] = React.useState("")
  const [fromBase, setFromBase] = React.useState(10)
  const [results, setResults] = React.useState<Record<number, string>>({})

  const bases = [
    { value: 2, label: "Binary (2)" },
    { value: 8, label: "Octal (8)" },
    { value: 10, label: "Decimal (10)" },
    { value: 16, label: "Hexadecimal (16)" },
  ]

  React.useEffect(() => {
    if (!input.trim()) {
      setResults({})
      return
    }

    const newResults: Record<number, string> = {}
    bases.forEach((base) => {
      if (base.value !== fromBase) {
        newResults[base.value] = convertBase(input, fromBase, base.value)
      } else {
        newResults[base.value] = input
      }
    })
    setResults(newResults)
  }, [input, fromBase])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>Enter number and select base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-base">From Base</Label>
            <select
              id="from-base"
              value={fromBase}
              onChange={(e) => setFromBase(parseInt(e.target.value))}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {bases.map((base) => (
                <option key={base.value} value={base.value}>
                  {base.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="input">Number</Label>
            <Input
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter number..."
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Converted Values</CardTitle>
          <CardDescription>All base representations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bases.map((base) => (
            <div key={base.value} className="space-y-2">
              <Label>{base.label}</Label>
              <div className="flex gap-2">
                <Input
                  value={results[base.value] || ""}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(results[base.value] || "")}
                  disabled={!results[base.value]}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
