"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

function generateUUID(): string {
  return crypto.randomUUID()
}

export default function UUIDGeneratorPage() {
  const tool = getToolByPath("/generators/uuid-generator")
  const [uuids, setUuids] = React.useState<string[]>([])
  const [count, setCount] = React.useState(1)

  const generateUUIDs = React.useCallback(() => {
    const newUUIDs: string[] = []
    for (let i = 0; i < count; i++) {
      newUUIDs.push(generateUUID())
    }
    setUuids(newUUIDs)
  }, [count])

  React.useEffect(() => {
    generateUUIDs()
  }, [generateUUIDs])

  const copyToClipboard = (uuid: string) => {
    navigator.clipboard.writeText(uuid)
    toast.success("UUID copied to clipboard")
  }

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(uuids.join("\n"))
    toast.success("All UUIDs copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure UUID generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of UUIDs</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              />
            </div>

            <Button onClick={generateUUIDs} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate UUIDs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated UUIDs</CardTitle>
                <CardDescription>{uuids.length} UUID{uuids.length !== 1 ? "s" : ""} generated</CardDescription>
              </div>
              {uuids.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyAllToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {uuids.length === 0 ? (
                <p className="text-muted-foreground text-sm">No UUIDs generated yet</p>
              ) : (
                uuids.map((uuid, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border">
                    <code className="flex-1 font-mono text-sm">{uuid}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(uuid)}
                      className="h-8 w-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
