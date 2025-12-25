"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Simplified MAC vendor lookup (in production use a proper database)
const macVendors: Record<string, string> = {
  "00:50:56": "VMware",
  "00:0C:29": "VMware",
  "00:1B:21": "Intel",
  "00:1E:67": "Apple",
  "00:25:00": "Apple",
  "08:00:27": "VirtualBox",
  "52:54:00": "QEMU",
}

function lookupMAC(mac: string) {
  const cleaned = mac.replace(/[:-]/g, ":").toUpperCase()
  const oui = cleaned.split(":").slice(0, 3).join(":")
  return macVendors[oui] || "Unknown vendor"
}

export default function MACAddressLookupPage() {
  const tool = getToolByPath("/mac-address-lookup")
  const [input, setInput] = React.useState("")
  const vendor = React.useMemo(() => {
    if (!input.trim()) return null
    return lookupMAC(input)
  }, [input])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>MAC Address</CardTitle>
          <CardDescription>Enter MAC address to lookup</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="00:1B:21:AB:CD:EF"
            className="font-mono"
          />
        </CardContent>
      </Card>

      {vendor && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>MAC address lookup result</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Vendor</Label>
              <p className="font-semibold text-lg">{vendor}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Note: This is a simplified lookup. For production use, integrate with a comprehensive MAC vendor database.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
