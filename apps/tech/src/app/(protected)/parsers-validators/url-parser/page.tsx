"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function parseURL(url: string) {
  try {
    const urlObj = new URL(url)
    const params: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value
    })

    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || "default",
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin,
      username: urlObj.username || "",
      password: urlObj.password || "",
      params,
    }
  } catch {
    return null
  }
}

export default function URLParserPage() {
  const tool = getToolByPath("/parsers-validators/url-parser")
  const [input, setInput] = React.useState("")
  const parsed = React.useMemo(() => parseURL(input), [input])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>URL Input</CardTitle>
          <CardDescription>Enter URL to parse</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com/path?key=value#hash"
            className="font-mono"
          />
        </CardContent>
      </Card>

      {parsed ? (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Components</CardTitle>
            <CardDescription>URL breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Protocol</Label>
                <p className="font-mono">{parsed.protocol}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Hostname</Label>
                <p className="font-mono">{parsed.hostname}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Port</Label>
                <p className="font-mono">{parsed.port}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Pathname</Label>
                <p className="font-mono">{parsed.pathname}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Search</Label>
                <p className="font-mono">{parsed.search || "(none)"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Hash</Label>
                <p className="font-mono">{parsed.hash || "(none)"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Origin</Label>
                <p className="font-mono">{parsed.origin}</p>
              </div>
              {parsed.username && (
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="font-mono">{parsed.username}</p>
                </div>
              )}
            </div>

            {Object.keys(parsed.params).length > 0 && (
              <div>
                <Label className="text-muted-foreground">Query Parameters</Label>
                <div className="mt-2 space-y-1">
                  {Object.entries(parsed.params).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="font-mono font-semibold">{key}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : input ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Invalid URL</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
