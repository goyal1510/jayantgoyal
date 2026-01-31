"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { Download } from "lucide-react"
import { toast } from "sonner"

export default function QRCodeGeneratorClient() {
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR Code" className="border rounded" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
