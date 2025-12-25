"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function convertIP(ip: string) {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return null
  }
  
  const decimal = (parts[0]! << 24) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!
  const binary = parts.map(p => p.toString(2).padStart(8, "0")).join(".")
  const hex = parts.map(p => p.toString(16).toUpperCase().padStart(2, "0")).join(":")
  
  return {
    decimal,
    binary,
    hex,
    dottedDecimal: ip,
  }
}

export default function IPv4AddressConverterPage() {
  const tool = getToolByPath("/network-tools/ipv4-address-converter")
  const [input, setInput] = React.useState("")
  const converted = React.useMemo(() => input ? convertIP(input) : null, [input])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>IPv4 Address</CardTitle>
          <CardDescription>Enter IP address to convert</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="192.168.1.1"
            className="font-mono"
          />
        </CardContent>
      </Card>

      {converted ? (
        <Card>
          <CardHeader>
            <CardTitle>Converted Formats</CardTitle>
            <CardDescription>All representations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dotted Decimal</Label>
              <div className="flex gap-2">
                <Input value={converted.dottedDecimal} readOnly className="font-mono" />
                <button
                  onClick={() => copyToClipboard(converted.dottedDecimal)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Decimal</Label>
              <div className="flex gap-2">
                <Input value={converted.decimal.toString()} readOnly className="font-mono" />
                <button
                  onClick={() => copyToClipboard(converted.decimal.toString())}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Binary</Label>
              <div className="flex gap-2">
                <Input value={converted.binary} readOnly className="font-mono" />
                <button
                  onClick={() => copyToClipboard(converted.binary)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hexadecimal</Label>
              <div className="flex gap-2">
                <Input value={converted.hex} readOnly className="font-mono" />
                <button
                  onClick={() => copyToClipboard(converted.hex)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : input ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Invalid IP address</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
