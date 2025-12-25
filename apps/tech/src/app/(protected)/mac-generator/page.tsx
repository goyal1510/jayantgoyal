"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

function generateMACAddress(prefix?: string, uppercase: boolean = false): string {
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  
  let mac = ""
  if (prefix) {
    const prefixParts = prefix.split(":").filter(p => p.length === 2)
    if (prefixParts.length > 0 && prefixParts.length <= 6) {
      mac = prefixParts.join(":")
      const remaining = 6 - prefixParts.length
      for (let i = 0; i < remaining; i++) {
        const byte = array[i + prefixParts.length] ?? 0
        mac += ":" + byte.toString(16).padStart(2, "0")
      }
    } else {
      // Invalid prefix, generate full MAC
      mac = Array.from(array).map(b => (b ?? 0).toString(16).padStart(2, "0")).join(":")
    }
  } else {
    mac = Array.from(array).map(b => (b ?? 0).toString(16).padStart(2, "0")).join(":")
  }
  
  return uppercase ? mac.toUpperCase() : mac.toLowerCase()
}

export default function MACGeneratorPage() {
  const tool = getToolByPath("/mac-generator")
  const [macs, setMacs] = React.useState<string[]>([])
  const [count, setCount] = React.useState(1)
  const [prefix, setPrefix] = React.useState("")
  const [uppercase, setUppercase] = React.useState(false)

  const generateMACs = React.useCallback(() => {
    const newMACs: string[] = []
    for (let i = 0; i < count; i++) {
      newMACs.push(generateMACAddress(prefix || undefined, uppercase))
    }
    setMacs(newMACs)
  }, [count, prefix, uppercase])

  React.useEffect(() => {
    generateMACs()
  }, [generateMACs])

  const copyToClipboard = (mac: string) => {
    navigator.clipboard.writeText(mac)
    toast.success("MAC address copied to clipboard")
  }

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(macs.join("\n"))
    toast.success("All MAC addresses copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure MAC address generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="count">Quantity</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix (optional)</Label>
              <Input
                id="prefix"
                placeholder="e.g., 00:1A:2B"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter MAC prefix in format XX:XX:XX (up to 6 octets)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="uppercase"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="uppercase" className="cursor-pointer">
                Uppercase
              </Label>
            </div>

            <Button onClick={generateMACs} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate MAC Addresses
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated MAC Addresses</CardTitle>
                <CardDescription>{macs.length} MAC address{macs.length !== 1 ? "es" : ""} generated</CardDescription>
              </div>
              {macs.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyAllToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {macs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No MAC addresses generated yet</p>
              ) : (
                macs.map((mac, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border">
                    <code className="flex-1 font-mono text-sm">{mac}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(mac)}
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
