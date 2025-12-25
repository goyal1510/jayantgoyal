"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

const caseTypes = [
  { id: "lowercase", label: "lowercase", fn: (s: string) => s.toLowerCase() },
  { id: "uppercase", label: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
  { id: "title", label: "Title Case", fn: (s: string) => s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) },
  { id: "camel", label: "camelCase", fn: (s: string) => s.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, "") },
  { id: "pascal", label: "PascalCase", fn: (s: string) => s.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, "") },
  { id: "snake", label: "snake_case", fn: (s: string) => s.replace(/\W+/g, " ").split(/ |\B(?=[A-Z])/).map(word => word.toLowerCase()).join("_") },
  { id: "kebab", label: "kebab-case", fn: (s: string) => s.replace(/\W+/g, " ").split(/ |\B(?=[A-Z])/).map(word => word.toLowerCase()).join("-") },
  { id: "constant", label: "CONSTANT_CASE", fn: (s: string) => s.replace(/\W+/g, " ").split(/ |\B(?=[A-Z])/).map(word => word.toUpperCase()).join("_") },
]

export default function CaseConverterPage() {
  const tool = getToolByPath("/case-converter")
  const [input, setInput] = React.useState("")
  const [results, setResults] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (!input.trim()) {
      setResults({})
      return
    }

    const newResults: Record<string, string> = {}
    caseTypes.forEach((type) => {
      newResults[type.id] = type.fn(input)
    })
    setResults(newResults)
  }, [input])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>Enter text to convert</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text..."
            className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Converted Cases</CardTitle>
          <CardDescription>All case variations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {caseTypes.map((type) => (
            <div key={type.id} className="space-y-2">
              <Label>{type.label}</Label>
              <div className="flex gap-2">
                <Input
                  value={results[type.id] || ""}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(results[type.id] || "")}
                  disabled={!results[type.id]}
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
