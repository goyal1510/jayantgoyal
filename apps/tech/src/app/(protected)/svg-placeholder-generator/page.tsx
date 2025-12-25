"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function generateSVGPlaceholder(width: number, height: number, text?: string): string {
  const displayText = text || `${width}x${height}`
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">${displayText}</text>
</svg>`
}

export default function SVGPlaceholderGeneratorPage() {
  const tool = getToolByPath("/svg-placeholder-generator")
  const [width, setWidth] = React.useState(300)
  const [height, setHeight] = React.useState(200)
  const [text, setText] = React.useState("")
  const [svg, setSvg] = React.useState("")

  React.useEffect(() => {
    setSvg(generateSVGPlaceholder(width, height, text || undefined))
  }, [width, height, text])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(svg)
    toast.success("SVG copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
          <CardDescription>Configure placeholder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                min="1"
                max="2000"
                value={width}
                onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                min="1"
                max="2000"
                value={height}
                onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Custom Text (optional)</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Leave empty for dimensions"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SVG Placeholder</CardTitle>
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy SVG
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center border rounded p-4 bg-muted">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <textarea
            value={svg}
            readOnly
            className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono"
          />
        </CardContent>
      </Card>
    </div>
  )
}
