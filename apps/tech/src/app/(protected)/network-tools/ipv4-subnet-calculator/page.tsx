"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function parseCIDR(cidr: string) {
  const [ip, prefix] = cidr.split("/")
  if (!ip || !prefix) return null
  
  const prefixLength = parseInt(prefix)
  if (prefixLength < 0 || prefixLength > 32) return null
  
  const ipParts = ip.split(".").map(Number)
  if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) return null
  
  const ipNumber = (ipParts[0]! << 24) + (ipParts[1]! << 16) + (ipParts[2]! << 8) + ipParts[3]!
  const subnetMask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0
  const networkAddress = ipNumber & subnetMask
  const broadcastAddress = networkAddress | (~subnetMask >>> 0)
  const hostCount = Math.pow(2, 32 - prefixLength) - 2
  
  return {
    network: formatIP(networkAddress),
    broadcast: formatIP(broadcastAddress),
    subnetMask: formatIP(subnetMask),
    firstHost: formatIP(networkAddress + 1),
    lastHost: formatIP(broadcastAddress - 1),
    hostCount,
    prefixLength,
  }
}

function formatIP(num: number): string {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF,
  ].join(".")
}

export default function IPv4SubnetCalculatorPage() {
  const tool = getToolByPath("/network-tools/ipv4-subnet-calculator")
  const [input, setInput] = React.useState("")
  const parsed = React.useMemo(() => input ? parseCIDR(input) : null, [input])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>CIDR Block</CardTitle>
          <CardDescription>Enter CIDR notation (e.g., 192.168.1.0/24)</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="192.168.1.0/24"
            className="font-mono"
          />
        </CardContent>
      </Card>

      {parsed ? (
        <Card>
          <CardHeader>
            <CardTitle>Subnet Information</CardTitle>
            <CardDescription>Calculated subnet details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Network Address</Label>
                <p className="font-mono font-semibold">{parsed.network}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Broadcast Address</Label>
                <p className="font-mono font-semibold">{parsed.broadcast}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Subnet Mask</Label>
                <p className="font-mono">{parsed.subnetMask}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Prefix Length</Label>
                <p className="font-mono">/{parsed.prefixLength}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">First Host</Label>
                <p className="font-mono">{parsed.firstHost}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Host</Label>
                <p className="font-mono">{parsed.lastHost}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Usable Hosts</Label>
                <p className="font-semibold text-lg">{parsed.hostCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : input ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Invalid CIDR notation</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
