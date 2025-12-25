"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

export default function ListConverterPage() {
  const tool = getToolByPath("/text-tools/list-converter")
  const [input, setInput] = React.useState("")
  const [prefix, setPrefix] = React.useState("")
  const [suffix, setSuffix] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState<"none" | "asc" | "desc">("none")
  const [toLowerCase, setToLowerCase] = React.useState(false)
  const [reverse, setReverse] = React.useState(false)

  const processList = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    let lines = input.split("\n").filter(line => line.trim())
    
    if (toLowerCase) {
      lines = lines.map(line => line.toLowerCase())
    }
    
    if (sortOrder === "asc") {
      lines = [...lines].sort()
    } else if (sortOrder === "desc") {
      lines = [...lines].sort().reverse()
    }
    
    if (reverse) {
      lines = lines.reverse()
    }
    
    lines = lines.map(line => `${prefix}${line}${suffix}`)
    
    setOutput(lines.join("\n"))
  }, [input, prefix, suffix, sortOrder, toLowerCase, reverse])

  React.useEffect(() => {
    processList()
  }, [processList])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Processed list copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input & Options</CardTitle>
            <CardDescription>Enter list and configure transformations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">List (one item per line)</Label>
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Item 1&#10;Item 2&#10;Item 3"
                className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g., - "
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="e.g., ,"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort">Sort Order</Label>
              <select
                id="sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "none" | "asc" | "desc")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="none">None</option>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowercase"
                checked={toLowerCase}
                onChange={(e) => setToLowerCase(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="lowercase" className="cursor-pointer">
                Convert to lowercase
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="reverse"
                checked={reverse}
                onChange={(e) => setReverse(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="reverse" className="cursor-pointer">
                Reverse list
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Processed List</CardTitle>
                <CardDescription>Transformed output</CardDescription>
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
              placeholder="Processed list will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
