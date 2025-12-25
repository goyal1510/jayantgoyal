"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function jsonToCSV(json: any[]): string {
  if (json.length === 0) return ""
  
  const headers = Object.keys(json[0]!)
  const rows = json.map(obj => headers.map(header => {
    const value = obj[header]
    if (value === null || value === undefined) return ""
    if (typeof value === "object") return JSON.stringify(value)
    return String(value).replace(/"/g, '""')
  }))
  
  return [
    headers.map(h => `"${h}"`).join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")
}

export default function JSONToCSVPage() {
  const tool = getToolByPath("/json-to-csv")
  const [input, setInput] = React.useState("")
  const [csv, setCsv] = React.useState("")
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setCsv("")
      setError("")
      return
    }

    try {
      const parsed = JSON.parse(input)
      if (!Array.isArray(parsed)) {
        setError("JSON must be an array of objects")
        setCsv("")
        return
      }
      setCsv(jsonToCSV(parsed))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON")
      setCsv("")
    }
  }, [input])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(csv)
    toast.success("CSV copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>JSON Input</CardTitle>
            <CardDescription>Enter JSON array</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='[{"name": "John", "age": 30}]'
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
              <CardTitle>CSV Output</CardTitle>
              {csv && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={csv}
              readOnly
              placeholder="CSV will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
