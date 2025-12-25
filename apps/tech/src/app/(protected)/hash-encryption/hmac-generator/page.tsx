"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

async function generateHMAC(message: string, secret: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  let hashAlgorithm: string
  switch (algorithm) {
    case "SHA-256":
      hashAlgorithm = "SHA-256"
      break
    case "SHA-384":
      hashAlgorithm = "SHA-384"
      break
    case "SHA-512":
      hashAlgorithm = "SHA-512"
      break
    case "SHA-1":
      hashAlgorithm = "SHA-1"
      break
    default:
      hashAlgorithm = "SHA-256"
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: hashAlgorithm },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, messageData)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

export default function HMACGeneratorPage() {
  const tool = getToolByPath("/hash-encryption/hmac-generator")
  const [message, setMessage] = React.useState("")
  const [secret, setSecret] = React.useState("")
  const [algorithm, setAlgorithm] = React.useState("SHA-256")
  const [hmac, setHmac] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)

  const algorithms = [
    { value: "SHA-1", label: "SHA-1" },
    { value: "SHA-256", label: "SHA-256" },
    { value: "SHA-384", label: "SHA-384" },
    { value: "SHA-512", label: "SHA-512" },
  ]

  const generateHMACValue = React.useCallback(async () => {
    if (!message.trim() || !secret.trim()) {
      setHmac("")
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateHMAC(message, secret, algorithm)
      setHmac(result)
    } catch (error) {
      toast.error("Failed to generate HMAC")
      setHmac("")
    } finally {
      setIsGenerating(false)
    }
  }, [message, secret, algorithm])

  React.useEffect(() => {
    generateHMACValue()
  }, [generateHMACValue])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hmac)
    toast.success("HMAC copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Enter message and secret key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="algorithm">Hash Algorithm</Label>
              <select
                id="algorithm"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {algorithms.map((alg) => (
                  <option key={alg.value} value={alg.value}>
                    {alg.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message to sign..."
                className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key</Label>
              <Input
                id="secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter secret key..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HMAC Output</CardTitle>
            <CardDescription>Hash-based message authentication code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>HMAC ({algorithm})</Label>
              <div className="flex gap-2">
                <Input
                  value={hmac}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  disabled={!hmac || isGenerating}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {hmac && (
              <div className="text-sm text-muted-foreground">
                <p>Length: {hmac.length} characters</p>
                <p>Algorithm: HMAC-{algorithm}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
