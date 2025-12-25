"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function dockerRunToCompose(dockerRun: string): string {
  // Simple converter - parse docker run command and convert to docker-compose format
  const lines = dockerRun.split("\\").map(s => s.trim()).filter(Boolean)
  let image = ""
  const ports: string[] = []
  const volumes: string[] = []
  const env: string[] = []
  const name = ""
  
  lines.forEach((line) => {
    if (line.includes("docker run")) {
      const parts = line.split(/\s+/)
      const imageIndex = parts.findIndex(p => !p.startsWith("-"))
      if (imageIndex > 0) {
        image = parts[imageIndex] || ""
      }
    }
    if (line.includes("-p ") || line.includes("--publish")) {
      const match = line.match(/-p\s+(\S+)|--publish\s+(\S+)/)
      if (match) {
        ports.push(match[1] || match[2] || "")
      }
    }
    if (line.includes("-v ") || line.includes("--volume")) {
      const match = line.match(/-v\s+(\S+)|--volume\s+(\S+)/)
      if (match) {
        volumes.push(match[1] || match[2] || "")
      }
    }
    if (line.includes("-e ") || line.includes("--env")) {
      const match = line.match(/-e\s+(\S+)|--env\s+(\S+)/)
      if (match) {
        env.push(match[1] || match[2] || "")
      }
    }
  })
  
  let compose = "version: '3'\n\nservices:\n  app:\n"
  if (image) compose += `    image: ${image}\n`
  if (ports.length > 0) {
    compose += "    ports:\n"
    ports.forEach(p => compose += `      - "${p}"\n`)
  }
  if (volumes.length > 0) {
    compose += "    volumes:\n"
    volumes.forEach(v => compose += `      - ${v}\n`)
  }
  if (env.length > 0) {
    compose += "    environment:\n"
    env.forEach(e => compose += `      - ${e}\n`)
  }
  
  return compose
}

export default function DockerConverterPage() {
  const tool = getToolByPath("/code-dev-tools/docker-converter")
  const [dockerRun, setDockerRun] = React.useState("")
  const [compose, setCompose] = React.useState("")

  React.useEffect(() => {
    if (!dockerRun.trim()) {
      setCompose("")
      return
    }
    try {
      setCompose(dockerRunToCompose(dockerRun))
    } catch {
      setCompose("Failed to convert")
    }
  }, [dockerRun])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(compose)
    toast.success("Docker Compose copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Docker Run Command</CardTitle>
            <CardDescription>Enter docker run command</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={dockerRun}
              onChange={(e) => setDockerRun(e.target.value)}
              placeholder="docker run -p 3000:3000 -v /data:/app/data node:18"
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Docker Compose</CardTitle>
                <CardDescription>Converted YAML</CardDescription>
              </div>
              {compose && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={compose}
              readOnly
              placeholder="Docker Compose YAML will appear here..."
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
