"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function KeycodeInfoPage() {
  const tool = getToolByPath("/keycode-info")
  const [keyInfo, setKeyInfo] = React.useState<{
    key: string
    code: string
    keyCode: number
    location: number
    ctrl: boolean
    shift: boolean
    alt: boolean
    meta: boolean
  } | null>(null)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeyInfo({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        location: e.location,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Press Any Key</CardTitle>
          <CardDescription>Key information will appear below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
            {keyInfo ? (
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold">{keyInfo.key}</div>
                <p className="text-sm text-muted-foreground">Press another key to update</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Press any key on your keyboard...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {keyInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Key Information</CardTitle>
            <CardDescription>Detailed key data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Key</Label>
                <p className="font-mono font-semibold">{keyInfo.key}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Code</Label>
                <p className="font-mono">{keyInfo.code}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Key Code</Label>
                <p className="font-mono">{keyInfo.keyCode}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="font-mono">{keyInfo.location}</p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Modifiers</Label>
              <div className="flex gap-4 mt-2">
                <span className={`px-2 py-1 rounded text-sm ${keyInfo.ctrl ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  Ctrl
                </span>
                <span className={`px-2 py-1 rounded text-sm ${keyInfo.shift ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  Shift
                </span>
                <span className={`px-2 py-1 rounded text-sm ${keyInfo.alt ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  Alt
                </span>
                <span className={`px-2 py-1 rounded text-sm ${keyInfo.meta ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  Meta
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
