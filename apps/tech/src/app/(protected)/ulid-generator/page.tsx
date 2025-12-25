"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// ULID generation implementation
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const TIME_LEN = 10
const RANDOM_LEN = 16

function encodeTime(now: number, len: number): string {
  let str = ""
  while (len > 0) {
    str = ENCODING[now % 32] + str
    now = Math.floor(now / 32)
    len--
  }
  return str
}

function generateULID(): string {
  const now = Date.now()
  const time = encodeTime(now, TIME_LEN)
  
  let random = ""
  const array = new Uint8Array(RANDOM_LEN)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < RANDOM_LEN; i++) {
    const byte = array[i] ?? 0
    random += ENCODING[byte % 32]
  }
  
  return time + random
}

export default function ULIDGeneratorPage() {
  const tool = getToolByPath("/ulid-generator")
  const [ulids, setUlids] = React.useState<string[]>([])
  const [count, setCount] = React.useState(1)

  const generateULIDs = React.useCallback(() => {
    const newULIDs: string[] = []
    for (let i = 0; i < count; i++) {
      newULIDs.push(generateULID())
    }
    setUlids(newULIDs)
  }, [count])

  React.useEffect(() => {
    generateULIDs()
  }, [generateULIDs])

  const copyToClipboard = (ulid: string) => {
    navigator.clipboard.writeText(ulid)
    toast.success("ULID copied to clipboard")
  }

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(ulids.join("\n"))
    toast.success("All ULIDs copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure ULID generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of ULIDs</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              />
            </div>

            <Button onClick={generateULIDs} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate ULIDs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated ULIDs</CardTitle>
                <CardDescription>{ulids.length} ULID{ulids.length !== 1 ? "s" : ""} generated</CardDescription>
              </div>
              {ulids.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyAllToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {ulids.length === 0 ? (
                <p className="text-muted-foreground text-sm">No ULIDs generated yet</p>
              ) : (
                ulids.map((ulid, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border">
                    <code className="flex-1 font-mono text-sm">{ulid}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(ulid)}
                      className="h-8 w-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
