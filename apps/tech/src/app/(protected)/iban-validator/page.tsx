"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle } from "lucide-react"

function validateIBAN(iban: string): { valid: boolean; country?: string; bankCode?: string; account?: string } {
  const cleaned = iban.replace(/\s/g, "").toUpperCase()
  
  if (cleaned.length < 15 || cleaned.length > 34) {
    return { valid: false }
  }

  const countryCode = cleaned.slice(0, 2)
  const checkDigits = cleaned.slice(2, 4)
  const bban = cleaned.slice(4)

  // Move first 4 characters to end
  const rearranged = bban + countryCode + checkDigits

  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  const numeric = rearranged
    .split("")
    .map((char) => {
      if (/[A-Z]/.test(char)) {
        return (char.charCodeAt(0) - 55).toString()
      }
      return char
    })
    .join("")

  // Calculate mod 97
  let remainder = ""
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder + numeric[i]).replace(/^0+/, "")
    if (remainder.length >= 9) {
      remainder = (parseInt(remainder.slice(0, 9)) % 97).toString() + remainder.slice(9)
    }
  }
  const mod97 = parseInt(remainder) % 97

  const valid = mod97 === 1

  return {
    valid,
    country: countryCode,
    bankCode: bban.slice(0, 4),
    account: bban.slice(4),
  }
}

export default function IBANValidatorPage() {
  const tool = getToolByPath("/iban-validator")
  const [input, setInput] = React.useState("")
  const result = React.useMemo(() => input ? validateIBAN(input) : null, [input])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>IBAN Input</CardTitle>
          <CardDescription>Enter IBAN to validate</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="GB82 WEST 1234 5698 7654 32"
            className="font-mono"
          />
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Result</CardTitle>
            <CardDescription>IBAN analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {result.valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-green-500">Valid IBAN</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-500">Invalid IBAN</span>
                </>
              )}
            </div>

            {result.valid && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Country Code</Label>
                  <p className="font-mono font-semibold">{result.country}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bank Code</Label>
                  <p className="font-mono">{result.bankCode}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Account Number</Label>
                  <p className="font-mono">{result.account}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
