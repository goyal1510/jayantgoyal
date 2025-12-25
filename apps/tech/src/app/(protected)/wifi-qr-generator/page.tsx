"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import { toast } from "sonner"

export default function WiFiQRGeneratorPage() {
  const tool = getToolByPath("/wifi-qr-generator")
  const [ssid, setSSID] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [security, setSecurity] = React.useState("WPA")
  const [hidden, setHidden] = React.useState(false)
  const [qrUrl, setQrUrl] = React.useState("")

  React.useEffect(() => {
    if (!ssid.trim()) {
      setQrUrl("")
      return
    }
    
    // WiFi QR code format: WIFI:T:WPA;S:SSID;P:Password;H:true;;
    const wifiString = `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? "true" : "false"};;`
    const encoded = encodeURIComponent(wifiString)
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`)
  }, [ssid, password, security, hidden])

  const downloadQR = () => {
    if (!qrUrl) return
    const link = document.createElement("a")
    link.href = qrUrl
    link.download = "wifi-qrcode.png"
    link.click()
    toast.success("WiFi QR code downloaded")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WiFi Details</CardTitle>
          <CardDescription>Enter WiFi network information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ssid">SSID (Network Name)</Label>
            <Input
              id="ssid"
              value={ssid}
              onChange={(e) => setSSID(e.target.value)}
              placeholder="MyWiFiNetwork"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="security">Security Type</Label>
            <select
              id="security"
              value={security}
              onChange={(e) => setSecurity(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hidden"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="hidden" className="cursor-pointer">
              Hidden network
            </Label>
          </div>
        </CardContent>
      </Card>

      {qrUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>WiFi QR Code</CardTitle>
              <Button variant="outline" onClick={downloadQR}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <img src={qrUrl} alt="WiFi QR Code" className="border rounded" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

