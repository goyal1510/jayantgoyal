"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function DeviceInformationPage() {
  const tool = getToolByPath("/other/device-information")
  const [info, setInfo] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setInfo({
      "Screen Size": `${window.screen.width}x${window.screen.height}`,
      "Pixel Ratio": window.devicePixelRatio.toString(),
      "User Agent": navigator.userAgent,
      "Platform": navigator.platform,
      "Language": navigator.language,
      "Cookies Enabled": navigator.cookieEnabled ? "Yes" : "No",
      "Online": navigator.onLine ? "Yes" : "No",
      "Viewport": `${window.innerWidth}x${window.innerHeight}`,
    })
  }, [])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Information</CardTitle>
          <CardDescription>Current device details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(info).map(([key, value]) => (
            <div key={key} className="flex justify-between items-start">
              <Label className="text-muted-foreground">{key}</Label>
              <p className="font-mono text-sm text-right max-w-[70%] break-all">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
