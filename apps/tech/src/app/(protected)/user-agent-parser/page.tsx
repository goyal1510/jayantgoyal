"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

function parseUserAgent(ua: string) {
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|IE)\/[\d.]+/)?.[0] || "Unknown"
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)/)?.[0] || "Unknown"
  const device = ua.match(/(Mobile|Tablet|Desktop)/)?.[0] || "Desktop"
  
  return {
    userAgent: ua,
    browser,
    os,
    device,
    engine: ua.match(/(Gecko|WebKit|Trident|Blink)/)?.[0] || "Unknown",
  }
}

export default function UserAgentParserPage() {
  const tool = getToolByPath("/user-agent-parser")
  const [input, setInput] = React.useState("")
  const parsed = React.useMemo(() => input ? parseUserAgent(input) : null, [input])

  const useCurrentUA = () => {
    setInput(navigator.userAgent)
  }

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
          <CardTitle>User Agent String</CardTitle>
          <CardDescription>Enter or detect user agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mozilla/5.0..."
              className="font-mono text-xs"
            />
            <Button variant="outline" onClick={useCurrentUA}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Use Current
            </Button>
          </div>
        </CardContent>
      </Card>

      {parsed && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Parsed Information</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(parsed.userAgent)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Browser</Label>
                <p className="font-semibold">{parsed.browser}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Operating System</Label>
                <p className="font-semibold">{parsed.os}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Device Type</Label>
                <p className="font-semibold">{parsed.device}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Engine</Label>
                <p className="font-semibold">{parsed.engine}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Full User Agent</Label>
              <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                {parsed.userAgent}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
