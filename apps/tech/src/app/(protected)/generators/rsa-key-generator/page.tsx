"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw, Download } from "lucide-react"
import { toast } from "sonner"

async function generateRSAKeyPair(modulusLength: number = 2048): Promise<{ privateKey: string; publicKey: string }> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    )

    // Export keys as PEM format
    const privateKeyData = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
    const publicKeyData = await crypto.subtle.exportKey("spki", keyPair.publicKey)

    // Convert to base64 and format as PEM
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyData)))
      .match(/.{1,64}/g)!
      .join("\n")
    
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyData)))
      .match(/.{1,64}/g)!
      .join("\n")

    return {
      privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`,
      publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`,
    }
  } catch (error) {
    throw new Error("Failed to generate RSA key pair")
  }
}

export default function RSAKeyGeneratorPage() {
  const tool = getToolByPath("/generators/rsa-key-generator")
  const [privateKey, setPrivateKey] = React.useState("")
  const [publicKey, setPublicKey] = React.useState("")
  const [modulusLength, setModulusLength] = React.useState(2048)
  const [isGenerating, setIsGenerating] = React.useState(false)

  const generateKeys = React.useCallback(async () => {
    setIsGenerating(true)
    try {
      const keys = await generateRSAKeyPair(modulusLength)
      setPrivateKey(keys.privateKey)
      setPublicKey(keys.publicKey)
      toast.success("RSA key pair generated successfully")
    } catch (error) {
      toast.error("Failed to generate RSA key pair")
    } finally {
      setIsGenerating(false)
    }
  }, [modulusLength])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard`)
  }

  const downloadKey = (key: string, filename: string) => {
    const blob = new Blob([key], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
          <CardDescription>Configure RSA key pair generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modulus">Modulus Length (bits)</Label>
            <select
              id="modulus"
              value={modulusLength}
              onChange={(e) => setModulusLength(parseInt(e.target.value))}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value={1024}>1024 bits</option>
              <option value={2048}>2048 bits (Recommended)</option>
              <option value={4096}>4096 bits</option>
            </select>
          </div>

          <Button onClick={generateKeys} className="w-full" disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Generate Key Pair"}
          </Button>
        </CardContent>
      </Card>

      {privateKey && publicKey && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Private Key</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(privateKey, "Private key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => downloadKey(privateKey, "private_key.pem")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>Keep this key secure and private</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                readOnly
                value={privateKey}
                className="w-full h-48 font-mono text-xs p-3 rounded border bg-muted"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Public Key</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(publicKey, "Public key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => downloadKey(publicKey, "public_key.pem")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>Share this key publicly</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                readOnly
                value={publicKey}
                className="w-full h-48 font-mono text-xs p-3 rounded border bg-muted"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {privateKey && (
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Security Warning</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • Never share your private key with anyone
            </p>
            <p>
              • Store your private key securely (use a password manager or secure storage)
            </p>
            <p>
              • The private key is shown here for convenience - ensure you're in a secure environment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
