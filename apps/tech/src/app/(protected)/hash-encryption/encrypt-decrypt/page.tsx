"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Lock, Unlock } from "lucide-react"
import { toast } from "sonner"

async function encryptText(text: string, password: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: algorithm, length: 256 },
    false,
    ["encrypt"]
  )

  const iv = crypto.getRandomValues(new Uint8Array(16))
  const encrypted = await crypto.subtle.encrypt(
    { name: algorithm, iv: iv },
    key,
    data
  )

  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

async function decryptText(encryptedBase64: string, password: string, algorithm: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
    
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 32)
    const encrypted = combined.slice(32)

    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: algorithm, length: 256 },
      false,
      ["decrypt"]
    )

    const decrypted = await crypto.subtle.decrypt(
      { name: algorithm, iv: iv },
      key,
      encrypted
    )

    return decoder.decode(decrypted)
  } catch (error) {
    throw new Error("Decryption failed - incorrect password or corrupted data")
  }
}

export default function EncryptDecryptPage() {
  const tool = getToolByPath("/hash-encryption/encrypt-decrypt")
  const [mode, setMode] = React.useState<"encrypt" | "decrypt">("encrypt")
  const [input, setInput] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [algorithm, setAlgorithm] = React.useState("AES-GCM")
  const [output, setOutput] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  const algorithms = [
    { value: "AES-GCM", label: "AES-GCM" },
    { value: "AES-CBC", label: "AES-CBC" },
  ]

  const handleProcess = async () => {
    if (!input.trim() || !password.trim()) {
      setOutput("")
      return
    }

    setIsProcessing(true)
    try {
      if (mode === "encrypt") {
        const result = await encryptText(input, password, algorithm)
        setOutput(result)
        toast.success("Text encrypted successfully")
      } else {
        const result = await decryptText(input, password, algorithm)
        setOutput(result)
        toast.success("Text decrypted successfully")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operation failed"
      toast.error(message)
      setOutput("")
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Options</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={mode === "encrypt" ? "default" : "outline"}
                onClick={() => {
                  setMode("encrypt")
                  setOutput("")
                }}
              >
                <Lock className="h-4 w-4 mr-2" />
                Encrypt
              </Button>
              <Button
                variant={mode === "decrypt" ? "default" : "outline"}
                onClick={() => {
                  setMode("decrypt")
                  setOutput("")
                }}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Decrypt
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="algorithm">Algorithm</Label>
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
            <Label htmlFor="password">Password/Key</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter encryption password..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "encrypt" ? "Plain Text" : "Encrypted Text"}</CardTitle>
            <CardDescription>
              {mode === "encrypt" ? "Enter text to encrypt" : "Enter encrypted text to decrypt"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "encrypt" ? "Enter text to encrypt..." : "Enter encrypted text..."}
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === "encrypt" ? "Encrypted Text" : "Decrypted Text"}</CardTitle>
                <CardDescription>Result</CardDescription>
              </div>
              {output && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
            <Button
              onClick={handleProcess}
              className="w-full mt-4"
              disabled={isProcessing || !input.trim() || !password.trim()}
            >
              {isProcessing ? "Processing..." : mode === "encrypt" ? "Encrypt" : "Decrypt"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
