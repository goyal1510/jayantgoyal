"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function decodeSafeLink(url: string): string {
  try {
    const urlObj = new URL(url)
    const urlParam = urlObj.searchParams.get("url")
    if (urlParam) {
      return decodeURIComponent(urlParam)
    }
    return url
  } catch {
    return url
  }
}

export default function OutlookSafeLinkDecoderPage() {
  const tool = getToolByPath("/outlook-safelink-decoder")
  const [input, setInput] = React.useState("")
  const [decoded, setDecoded] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setDecoded("")
      return
    }
    setDecoded(decodeSafeLink(input))
  }, [input])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(decoded)
    toast.success("Decoded URL copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SafeLink URL</CardTitle>
            <CardDescription>Enter Outlook SafeLink URL</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://nam01.safelinks.protection.outlook.com/..."
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Decoded URL</CardTitle>
              {decoded && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={decoded}
              readOnly
              placeholder="Decoded URL will appear here..."
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
