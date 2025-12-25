"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function TokenGeneratorPage() {
  const tool = getToolByPath("/generators/token-generator")
  const [length, setLength] = React.useState(32)
  const [includeUppercase, setIncludeUppercase] = React.useState(true)
  const [includeLowercase, setIncludeLowercase] = React.useState(true)
  const [includeNumbers, setIncludeNumbers] = React.useState(true)
  const [includeSymbols, setIncludeSymbols] = React.useState(false)
  const [customChars, setCustomChars] = React.useState("")
  const [token, setToken] = React.useState("")

  const generateToken = React.useCallback(() => {
    let charset = ""
    
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if (customChars) charset += customChars

    if (!charset) {
      toast.error("Please select at least one character set")
      return
    }

    let result = ""
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < length; i++) {
      const byte = array[i] ?? 0
      result += charset[byte % charset.length]
    }
    
    setToken(result)
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, customChars])

  React.useEffect(() => {
    generateToken()
  }, [generateToken])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token)
    toast.success("Token copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure your token generation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Input
                id="length"
                type="number"
                min="1"
                max="1000"
                value={length}
                onChange={(e) => setLength(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="uppercase"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="uppercase" className="cursor-pointer">
                  Uppercase letters (A-Z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lowercase"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="lowercase" className="cursor-pointer">
                  Lowercase letters (a-z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="numbers"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="numbers" className="cursor-pointer">
                  Numbers (0-9)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="symbols"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="symbols" className="cursor-pointer">
                  Symbols (!@#$%...)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom">Custom Characters (optional)</Label>
              <Input
                id="custom"
                placeholder="Enter custom characters to include"
                value={customChars}
                onChange={(e) => setCustomChars(e.target.value)}
              />
            </div>

            <Button onClick={generateToken} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New Token
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Token</CardTitle>
            <CardDescription>Your secure random token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <div className="flex gap-2">
                <Input
                  value={token}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  disabled={!token}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Length: {token.length} characters</p>
              <p>Entropy: ~{Math.round(token.length * Math.log2((includeUppercase ? 26 : 0) + (includeLowercase ? 26 : 0) + (includeNumbers ? 10 : 0) + (includeSymbols ? 20 : 0) + customChars.length))} bits</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
