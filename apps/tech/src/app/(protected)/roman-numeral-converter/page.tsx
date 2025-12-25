"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

const ROMAN_VALUES: Record<string, number> = {
  M: 1000,
  CM: 900,
  D: 500,
  CD: 400,
  C: 100,
  XC: 90,
  L: 50,
  XL: 40,
  X: 10,
  IX: 9,
  V: 5,
  IV: 4,
  I: 1,
}

function numberToRoman(num: number): string {
  if (num <= 0 || num > 3999) return "Invalid (1-3999)"
  
  let result = ""
  for (const [roman, value] of Object.entries(ROMAN_VALUES)) {
    while (num >= value) {
      result += roman
      num -= value
    }
  }
  return result
}

function romanToNumber(roman: string): number {
  const upperRoman = roman.toUpperCase().trim()
  if (!upperRoman) return 0
  
  let result = 0
  let i = 0
  
  while (i < upperRoman.length) {
    const twoChar = upperRoman.slice(i, i + 2)
    if (ROMAN_VALUES[twoChar]) {
      result += ROMAN_VALUES[twoChar]
      i += 2
      } else {
        const oneChar = upperRoman[i]
        if (oneChar && ROMAN_VALUES[oneChar]) {
          result += ROMAN_VALUES[oneChar]
          i += 1
        } else {
          return NaN
        }
      }
  }
  
  return result
}

export default function RomanNumeralConverterPage() {
  const tool = getToolByPath("/roman-numeral-converter")
  const [mode, setMode] = React.useState<"to-roman" | "to-number">("to-roman")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  const convert = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      if (mode === "to-roman") {
        const num = parseInt(input)
        if (isNaN(num)) {
          setOutput("Invalid number")
          return
        }
        setOutput(numberToRoman(num))
      } else {
        const num = romanToNumber(input)
        if (isNaN(num)) {
          setOutput("Invalid Roman numeral")
          return
        }
        setOutput(num.toString())
      }
    } catch (error) {
      setOutput("Conversion failed")
    }
  }, [input, mode])

  React.useEffect(() => {
    convert()
  }, [convert])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mode</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={mode === "to-roman" ? "default" : "outline"}
                onClick={() => {
                  setMode("to-roman")
                  setOutput("")
                }}
              >
                Number → Roman
              </Button>
              <Button
                variant={mode === "to-number" ? "default" : "outline"}
                onClick={() => {
                  setMode("to-number")
                  setOutput("")
                }}
              >
                Roman → Number
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "to-roman" ? "Number" : "Roman Numeral"}</CardTitle>
            <CardDescription>
              {mode === "to-roman" ? "Enter number (1-3999)" : "Enter Roman numeral"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "to-roman" ? "e.g., 2024" : "e.g., MMXXIV"}
              className="font-mono text-lg"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === "to-roman" ? "Roman Numeral" : "Number"}</CardTitle>
                <CardDescription>Result</CardDescription>
              </div>
              {output && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Input
              value={output}
              readOnly
              className="font-mono text-lg"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
