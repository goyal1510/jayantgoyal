"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const mimeTypes: Record<string, string[]> = {
  "application/json": ["json"],
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/gif": ["gif"],
  "image/svg+xml": ["svg"],
  "text/html": ["html", "htm"],
  "text/css": ["css"],
  "text/javascript": ["js"],
  "text/plain": ["txt"],
  "video/mp4": ["mp4"],
  "audio/mpeg": ["mp3"],
}

const extensionToMime: Record<string, string> = {}
Object.entries(mimeTypes).forEach(([mime, exts]) => {
  exts.forEach(ext => {
    extensionToMime[ext] = mime
  })
})

export default function MIMETypesPage() {
  const tool = getToolByPath("/mime-types")
  const [input, setInput] = React.useState("")
  const [mode, setMode] = React.useState<"mime" | "ext">("mime")
  const [result, setResult] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!input.trim()) {
      setResult([])
      return
    }

    if (mode === "mime") {
      const mime = input.toLowerCase()
      setResult(mimeTypes[mime] || [])
    } else {
      const ext = input.toLowerCase().replace(/^\./, "")
      setResult([extensionToMime[ext] || "Unknown"])
    }
  }, [input, mode])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Convert</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("mime")}
                className={`px-3 py-1 rounded text-sm ${mode === "mime" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                MIME → Extensions
              </button>
              <button
                onClick={() => setMode("ext")}
                className={`px-3 py-1 rounded text-sm ${mode === "ext" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                Extension → MIME
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "mime" ? "application/json" : ".json"}
            className="font-mono"
          />
        </CardContent>
      </Card>

      {result.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.map((r, i) => (
                <p key={i} className="font-mono">{r}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
