"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ipToNumber(ip: string): number | null {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null
  return (parts[0]! << 24) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!
}

function numberToIP(num: number): string {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF,
  ].join(".")
}

function expandRange(startIP: string, endIP: string) {
  const start = ipToNumber(startIP)
  const end = ipToNumber(endIP)
  
  if (start === null || end === null || start > end) return null
  
  const range = end - start + 1
  const prefixLength = 32 - Math.ceil(Math.log2(range))
  
  // Find the network address
  const networkMask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0
  const networkAddress = start & networkMask
  
  return {
    startIP,
    endIP,
    network: numberToIP(networkAddress),
    broadcast: numberToIP(networkAddress | (~networkMask >>> 0)),
    cidr: `${numberToIP(networkAddress)}/${prefixLength}`,
    hostCount: range,
  }
}

export default function IPv4RangeExpanderPage() {
  const tool = getToolByPath("/ipv4-range-expander")
  const [startIP, setStartIP] = React.useState("")
  const [endIP, setEndIP] = React.useState("")
  const expanded = React.useMemo(() => {
    if (!startIP || !endIP) return null
    return expandRange(startIP, endIP)
  }, [startIP, endIP])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>IP Range</CardTitle>
          <CardDescription>Enter start and end IP addresses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start IP</Label>
              <Input
                id="start"
                value={startIP}
                onChange={(e) => setStartIP(e.target.value)}
                placeholder="192.168.1.1"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End IP</Label>
              <Input
                id="end"
                value={endIP}
                onChange={(e) => setEndIP(e.target.value)}
                placeholder="192.168.1.100"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {expanded ? (
        <Card>
          <CardHeader>
            <CardTitle>Subnet Information</CardTitle>
            <CardDescription>Calculated subnet for the range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Network Address</Label>
                <p className="font-mono font-semibold">{expanded.network}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Broadcast Address</Label>
                <p className="font-mono font-semibold">{expanded.broadcast}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">CIDR Notation</Label>
                <p className="font-mono font-semibold">{expanded.cidr}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Host Count</Label>
                <p className="font-semibold">{expanded.hostCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : startIP && endIP ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Invalid IP range</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
