"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function parsePhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, "")
  
  if (cleaned.length < 10) {
    return null
  }

  let countryCode = ""
  let areaCode = ""
  let number = ""

  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    countryCode = "+1"
    areaCode = cleaned.slice(1, 4)
    number = cleaned.slice(4)
  } else if (cleaned.length === 10) {
    areaCode = cleaned.slice(0, 3)
    number = cleaned.slice(3)
  } else if (cleaned.length > 11) {
    countryCode = `+${cleaned.slice(0, cleaned.length - 10)}`
    areaCode = cleaned.slice(cleaned.length - 10, cleaned.length - 7)
    number = cleaned.slice(cleaned.length - 7)
  }

  const formatted = countryCode
    ? `${countryCode} (${areaCode}) ${number.slice(0, 3)}-${number.slice(3)}`
    : `(${areaCode}) ${number.slice(0, 3)}-${number.slice(3)}`

  return {
    original: phone,
    cleaned,
    formatted,
    countryCode: countryCode || "N/A",
    areaCode,
    number,
    type: cleaned.length === 10 ? "Local" : "International",
  }
}

export default function PhoneParserPage() {
  const tool = getToolByPath("/phone-parser")
  const [input, setInput] = React.useState("")
  const parsed = React.useMemo(() => input ? parsePhoneNumber(input) : null, [input])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Phone Number Input</CardTitle>
          <CardDescription>Enter phone number to parse</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </CardContent>
      </Card>

      {parsed ? (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Information</CardTitle>
            <CardDescription>Phone number breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Formatted</Label>
                <p className="font-mono font-semibold">{parsed.formatted}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-semibold">{parsed.type}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Country Code</Label>
                <p className="font-mono">{parsed.countryCode}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Area Code</Label>
                <p className="font-mono">{parsed.areaCode}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Number</Label>
                <p className="font-mono">{parsed.number}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Cleaned (digits only)</Label>
                <p className="font-mono">{parsed.cleaned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : input ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Invalid phone number</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
