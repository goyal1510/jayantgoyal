"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

function generateRandomPort(): number {
  // Generate port between 1024 and 65535 (outside known ports 0-1023)
  return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024
}

export default function RandomPortGeneratorPage() {
  const tool = getToolByPath("/generators/random-port-generator")
  const [ports, setPorts] = React.useState<number[]>([])
  const [count, setCount] = React.useState(1)

  const generatePorts = React.useCallback(() => {
    const newPorts: number[] = []
    for (let i = 0; i < count; i++) {
      newPorts.push(generateRandomPort())
    }
    setPorts(newPorts)
  }, [count])

  React.useEffect(() => {
    generatePorts()
  }, [generatePorts])

  const copyToClipboard = (port: number) => {
    navigator.clipboard.writeText(port.toString())
    toast.success("Port copied to clipboard")
  }

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(ports.join("\n"))
    toast.success("All ports copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure port generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of Ports</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Ports are generated in the range 1024-65535</p>
              <p>• This excludes well-known ports (0-1023)</p>
            </div>

            <Button onClick={generatePorts} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Ports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Ports</CardTitle>
                <CardDescription>{ports.length} port{ports.length !== 1 ? "s" : ""} generated</CardDescription>
              </div>
              {ports.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyAllToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {ports.length === 0 ? (
                <p className="text-muted-foreground text-sm">No ports generated yet</p>
              ) : (
                ports.map((port, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border">
                    <code className="flex-1 font-mono text-sm">{port}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(port)}
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
