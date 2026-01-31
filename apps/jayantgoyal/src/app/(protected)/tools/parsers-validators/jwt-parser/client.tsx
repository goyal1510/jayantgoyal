"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function parseJWT(token: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format")
    }

    const header = JSON.parse(atob(parts[0]!.replace(/-/g, "+").replace(/_/g, "/")))
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")))
    const signature = parts[2]

    return {
      header,
      payload,
      signature,
      raw: {
        header: parts[0],
        payload: parts[1],
        signature: parts[2],
      },
    }
  } catch {
    throw new Error("Failed to parse JWT")
  }
}

export default function JWTParserClient() {
  const [input, setInput] = React.useState("")
  const [parsed, setParsed] = React.useState<ReturnType<typeof parseJWT> | null>(null)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setParsed(null)
      setError("")
      return
    }

    try {
      const result = parseJWT(input)
      setParsed(result)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JWT")
      setParsed(null)
    }
  }, [input])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JWT Token</CardTitle>
          <CardDescription>Enter JWT to parse</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="font-mono text-xs"
          />
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {parsed && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Header</CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(JSON.stringify(parsed.header, null, 2))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(parsed.header, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payload</CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(JSON.stringify(parsed.payload, null, 2))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(parsed.payload, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
