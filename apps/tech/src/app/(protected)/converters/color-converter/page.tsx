"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("").toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export default function ColorConverterPage() {
  const tool = getToolByPath("/converters/color-converter")
  const [hex, setHex] = React.useState("#FF5733")
  const [rgb, setRgb] = React.useState({ r: 255, g: 87, b: 51 })
  const [hsl, setHsl] = React.useState({ h: 9, s: 100, l: 60 })

  const updateFromHex = (hexValue: string) => {
    setHex(hexValue)
    const rgbValue = hexToRgb(hexValue)
    if (rgbValue) {
      setRgb(rgbValue)
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b))
    }
  }

  const updateFromRgb = (r: number, g: number, b: number) => {
    setRgb({ r, g, b })
    setHex(rgbToHex(r, g, b))
    setHsl(rgbToHsl(r, g, b))
  }

  const updateFromHsl = (h: number, s: number, l: number) => {
    setHsl({ h, s, l })
    // Convert HSL to RGB
    const hNorm = h / 360
    const sNorm = s / 100
    const lNorm = l / 100

    let r = 0
    let g = 0
    let b = 0

    if (sNorm === 0) {
      r = g = b = lNorm
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm
      const p = 2 * lNorm - q

      r = hue2rgb(p, q, hNorm + 1 / 3)
      g = hue2rgb(p, q, hNorm)
      b = hue2rgb(p, q, hNorm - 1 / 3)
    }

    const rgbValue = {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    }
    setRgb(rgbValue)
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Color Values</CardTitle>
            <CardDescription>Enter color in any format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hex">HEX</Label>
              <div className="flex gap-2">
                <Input
                  id="hex"
                  value={hex}
                  onChange={(e) => updateFromHex(e.target.value)}
                  className="font-mono"
                />
                <div
                  className="w-12 h-9 rounded border"
                  style={{ backgroundColor: hex }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RGB</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => updateFromRgb(parseInt(e.target.value) || 0, rgb.g, rgb.b)}
                />
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => updateFromRgb(rgb.r, parseInt(e.target.value) || 0, rgb.b)}
                />
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => updateFromRgb(rgb.r, rgb.g, parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSL</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="360"
                  value={hsl.h}
                  onChange={(e) => updateFromHsl(parseInt(e.target.value) || 0, hsl.s, hsl.l)}
                  placeholder="H"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={hsl.s}
                  onChange={(e) => updateFromHsl(hsl.h, parseInt(e.target.value) || 0, hsl.l)}
                  placeholder="S"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={hsl.l}
                  onChange={(e) => updateFromHsl(hsl.h, hsl.s, parseInt(e.target.value) || 0)}
                  placeholder="L"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formatted Output</CardTitle>
            <CardDescription>Copy formatted color values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>HEX</Label>
              <div className="flex gap-2">
                <Input value={hex} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(hex)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>RGB</Label>
              <div className="flex gap-2">
                <Input
                  value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSL</Label>
              <div className="flex gap-2">
                <Input
                  value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              className="w-full h-32 rounded border"
              style={{ backgroundColor: hex }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
