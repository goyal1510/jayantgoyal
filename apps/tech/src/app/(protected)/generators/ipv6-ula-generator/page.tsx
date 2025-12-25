"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// RFC4193 IPv6 ULA Generator
function generateIPv6ULA(): string {
  // Generate random 40-bit global ID
  const array = new Uint8Array(5)
  crypto.getRandomValues(array)
  
  // Set ULA prefix: fc00::/7, with L bit set (fd00::/8)
  const prefix = "fd"
  
  // Convert random bytes to hex
  const globalId = Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("")
  
  // Construct the 48-bit prefix: fd00::/8 + 40-bit global ID
  const prefix48 = prefix + globalId
  
  // Format as IPv6 address with subnet
  const segments = [
    prefix48.slice(0, 4),
    prefix48.slice(4, 8),
    prefix48.slice(8, 12),
  ]
  
  // Generate random interface identifier (64 bits)
  const ifArray = new Uint8Array(8)
  crypto.getRandomValues(ifArray)
  const interfaceId = Array.from(ifArray)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .match(/.{1,4}/g)!
    .join(":")
  
  // Construct full IPv6 address
  const address = `${segments.join(":")}::${interfaceId}`
  
  // Format with subnet notation
  return `${address}/48`
}

export default function IPv6ULAGeneratorPage() {
  const tool = getToolByPath("/generators/ipv6-ula-generator")
  const [addresses, setAddresses] = React.useState<string[]>([])
  const [count, setCount] = React.useState(1)

  const generateAddresses = React.useCallback(() => {
    const newAddresses: string[] = []
    for (let i = 0; i < count; i++) {
      newAddresses.push(generateIPv6ULA())
    }
    setAddresses(newAddresses)
  }, [count])

  React.useEffect(() => {
    generateAddresses()
  }, [generateAddresses])

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success("IPv6 ULA address copied to clipboard")
  }

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(addresses.join("\n"))
    toast.success("All addresses copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated IPv6 ULA Addresses</CardTitle>
              <CardDescription>
                {addresses.length} address{addresses.length !== 1 ? "es" : ""} generated according to RFC4193
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateAddresses}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </Button>
              {addresses.length > 0 && (
                <Button variant="outline" onClick={copyAllToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">No addresses generated yet</p>
            ) : (
              addresses.map((address, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border">
                  <code className="flex-1 font-mono text-sm">{address}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(address)}
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

      <Card>
        <CardHeader>
          <CardTitle>About IPv6 ULA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            IPv6 Unique Local Addresses (ULA) are defined in RFC4193 and are used for local,
            non-routable IP addresses within a private network.
          </p>
          <p>
            • Prefix: fd00::/8 (with L bit set)<br />
            • Global ID: 40-bit randomly generated identifier<br />
            • Subnet ID: 16-bit subnet identifier<br />
            • Interface ID: 64-bit interface identifier
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
