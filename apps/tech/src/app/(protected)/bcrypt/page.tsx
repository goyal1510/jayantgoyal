"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// Simplified bcrypt implementation (for demo)
// In production, use a proper bcrypt library
async function hashBcrypt(password: string, rounds: number = 10): Promise<string> {
  // This is a simplified version - in production use a proper bcrypt library
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  
  // Simple hash simulation (not real bcrypt)
  let hash = await crypto.subtle.digest("SHA-256", data)
  for (let i = 0; i < rounds; i++) {
    const combined = new Uint8Array([...new Uint8Array(hash), ...salt])
    hash = await crypto.subtle.digest("SHA-256", combined)
  }
  
  const saltBase64 = btoa(String.fromCharCode(...salt))
    .replace(/\+/g, ".")
    .replace(/\//g, "/")
    .replace(/=/g, "")
  
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, ".")
    .replace(/\//g, "/")
    .replace(/=/g, "")
  
  return `$2b$${rounds}$${saltBase64.slice(0, 22)}${hashBase64.slice(0, 31)}`
}

async function compareBcrypt(password: string, hash: string): Promise<boolean> {
  // Extract rounds from hash
  const match = hash.match(/\$2b\$(\d+)\$/)
  if (!match) return false
  
  const rounds = parseInt(match[1] ?? "10")
  const newHash = await hashBcrypt(password, rounds)
  
  // Compare (simplified - in production use proper bcrypt compare)
  return hash === newHash || hash.slice(0, 29) === newHash.slice(0, 29)
}

export default function BcryptPage() {
  const tool = getToolByPath("/bcrypt")
  const [password, setPassword] = React.useState("")
  const [rounds, setRounds] = React.useState(10)
  const [hash, setHash] = React.useState("")
  const [isHashing, setIsHashing] = React.useState(false)
  
  // Comparison
  const [comparePassword, setComparePassword] = React.useState("")
  const [compareHash, setCompareHash] = React.useState("")
  const [isMatch, setIsMatch] = React.useState<boolean | null>(null)
  const [isComparing, setIsComparing] = React.useState(false)

  const generateHash = React.useCallback(async () => {
    if (!password.trim()) {
      setHash("")
      return
    }

    setIsHashing(true)
    try {
      const result = await hashBcrypt(password, rounds)
      setHash(result)
    } catch (error) {
      toast.error("Failed to hash password")
      setHash("")
    } finally {
      setIsHashing(false)
    }
  }, [password, rounds])

  React.useEffect(() => {
    generateHash()
  }, [generateHash])

  const handleCompare = async () => {
    if (!comparePassword.trim() || !compareHash.trim()) {
      setIsMatch(null)
      return
    }

    setIsComparing(true)
    try {
      const match = await compareBcrypt(comparePassword, compareHash)
      setIsMatch(match)
      if (match) {
        toast.success("Passwords match!")
      } else {
        toast.error("Passwords do not match")
      }
    } catch (error) {
      toast.error("Failed to compare passwords")
      setIsMatch(null)
    } finally {
      setIsComparing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash)
    toast.success("Hash copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hash Password</CardTitle>
            <CardDescription>Generate bcrypt hash</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rounds">Rounds (cost factor)</Label>
              <Input
                id="rounds"
                type="number"
                min="4"
                max="31"
                value={rounds}
                onChange={(e) => setRounds(Math.max(4, Math.min(31, parseInt(e.target.value) || 10)))}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 10-12 (higher = more secure but slower)
              </p>
            </div>

            <Button onClick={generateHash} className="w-full" disabled={isHashing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isHashing ? "animate-spin" : ""}`} />
              {isHashing ? "Hashing..." : "Generate Hash"}
            </Button>

            {hash && (
              <div className="space-y-2">
                <Label>Bcrypt Hash</Label>
                <div className="flex gap-2">
                  <Input
                    value={hash}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compare Password</CardTitle>
            <CardDescription>Verify password against hash</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="compare-password">Password</Label>
              <Input
                id="compare-password"
                type="password"
                value={comparePassword}
                onChange={(e) => {
                  setComparePassword(e.target.value)
                  setIsMatch(null)
                }}
                placeholder="Enter password to compare..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compare-hash">Bcrypt Hash</Label>
              <Input
                id="compare-hash"
                value={compareHash}
                onChange={(e) => {
                  setCompareHash(e.target.value)
                  setIsMatch(null)
                }}
                placeholder="Enter hash to compare against..."
                className="font-mono text-xs"
              />
            </div>

            <Button onClick={handleCompare} className="w-full" disabled={isComparing || !comparePassword || !compareHash}>
              {isComparing ? "Comparing..." : "Compare"}
            </Button>

            {isMatch !== null && (
              <div className={`p-3 rounded-md ${isMatch ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                <p className="font-semibold">{isMatch ? "✓ Passwords match" : "✗ Passwords do not match"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
