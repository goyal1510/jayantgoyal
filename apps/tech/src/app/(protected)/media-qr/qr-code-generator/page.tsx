"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import { toast } from "sonner"

export default function QRCodeGeneratorPage() {
  const tool = getToolByPath("/media-qr/qr-code-generator")
  const [text, setText] = React.useState("")
  const [qrUrl, setQrUrl] = React.useState("")

  React.useEffect(() => {
    if (!text.trim()) {
      setQrUrl("")
      return
    }
    // Using a QR code API service
    const encoded = encodeURIComponent(text)
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`)
  }, [text])

  const downloadQR = () => {
    if (!qrUrl) return
    const link = document.createElement("a")
    link.href = qrUrl
    link.download = "qrcode.png"
    link.click()
    toast.success("QR code downloaded")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>Enter text or URL to encode</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL..."
          />
        </CardContent>
      </Card>

      {qrUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>QR Code</CardTitle>
              <Button variant="outline" onClick={downloadQR}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <img src={qrUrl} alt="QR Code" className="border rounded" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
