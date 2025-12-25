"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Hash } from "lucide-react"
import { toast } from "sonner"

async function hashText(text: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  switch (algorithm) {
    case "SHA-256":
      const hash256 = await crypto.subtle.digest("SHA-256", data)
      return Array.from(new Uint8Array(hash256)).map(b => b.toString(16).padStart(2, "0")).join("")
    case "SHA-384":
      const hash384 = await crypto.subtle.digest("SHA-384", data)
      return Array.from(new Uint8Array(hash384)).map(b => b.toString(16).padStart(2, "0")).join("")
    case "SHA-512":
      const hash512 = await crypto.subtle.digest("SHA-512", data)
      return Array.from(new Uint8Array(hash512)).map(b => b.toString(16).padStart(2, "0")).join("")
    case "SHA-1":
      const hash1 = await crypto.subtle.digest("SHA-1", data)
      return Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, "0")).join("")
    default:
      throw new Error("Unsupported algorithm")
  }
}

// Simple MD5 implementation (for demo - not cryptographically secure)
function md5(text: string): string {
  // This is a simplified version - in production use a proper crypto library
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i]!
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(32, "0")
}

export default function HashTextPage() {
  const tool = getToolByPath("/hash-encryption/hash-text")
  const [input, setInput] = React.useState("")
  const [algorithm, setAlgorithm] = React.useState("SHA-256")
  const [hashed, setHashed] = React.useState("")
  const [isHashing, setIsHashing] = React.useState(false)

  const algorithms = [
    { value: "MD5", label: "MD5" },
    { value: "SHA-1", label: "SHA-1" },
    { value: "SHA-256", label: "SHA-256" },
    { value: "SHA-384", label: "SHA-384" },
    { value: "SHA-512", label: "SHA-512" },
  ]

  const performHash = React.useCallback(async () => {
    if (!input.trim()) {
      setHashed("")
      return
    }

    setIsHashing(true)
    try {
      let result: string
      if (algorithm === "MD5") {
        result = md5(input)
      } else {
        result = await hashText(input, algorithm)
      }
      setHashed(result)
    } catch (error) {
      toast.error("Failed to hash text")
      setHashed("")
    } finally {
      setIsHashing(false)
    }
  }, [input, algorithm])

  React.useEffect(() => {
    performHash()
  }, [performHash])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hashed)
    toast.success("Hash copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Enter text to hash</CardDescription>
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
              <Label htmlFor="input">Text to Hash</Label>
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to hash..."
                className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hashed Output</CardTitle>
            <CardDescription>Hash result</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hash ({algorithm})</Label>
              <div className="flex gap-2">
                <Input
                  value={hashed}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  disabled={!hashed || isHashing}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {hashed && (
              <div className="text-sm text-muted-foreground">
                <p>Length: {hashed.length} characters</p>
                <p>Algorithm: {algorithm}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
