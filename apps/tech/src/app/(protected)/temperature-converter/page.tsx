"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function convertTemperature(value: number, from: string, to: string): number {
  // Convert to Celsius first
  let celsius = 0
  
  switch (from) {
    case "Celsius":
      celsius = value
      break
    case "Fahrenheit":
      celsius = (value - 32) * 5 / 9
      break
    case "Kelvin":
      celsius = value - 273.15
      break
    case "Rankine":
      celsius = (value - 491.67) * 5 / 9
      break
    case "Delisle":
      celsius = 100 - value * 2 / 3
      break
    case "Newton":
      celsius = value * 100 / 33
      break
    case "Réaumur":
      celsius = value * 5 / 4
      break
    case "Rømer":
      celsius = (value - 7.5) * 40 / 21
      break
    default:
      return value
  }
  
  // Convert from Celsius to target
  switch (to) {
    case "Celsius":
      return celsius
    case "Fahrenheit":
      return celsius * 9 / 5 + 32
    case "Kelvin":
      return celsius + 273.15
    case "Rankine":
      return celsius * 9 / 5 + 491.67
    case "Delisle":
      return (100 - celsius) * 3 / 2
    case "Newton":
      return celsius * 33 / 100
    case "Réaumur":
      return celsius * 4 / 5
    case "Rømer":
      return celsius * 21 / 40 + 7.5
    default:
      return celsius
  }
}

export default function TemperatureConverterPage() {
  const tool = getToolByPath("/temperature-converter")
  const [input, setInput] = React.useState("")
  const [fromUnit, setFromUnit] = React.useState("Celsius")
  const [results, setResults] = React.useState<Record<string, string>>({})

  const units = [
    "Celsius",
    "Fahrenheit",
    "Kelvin",
    "Rankine",
    "Delisle",
    "Newton",
    "Réaumur",
    "Rømer",
  ]

  React.useEffect(() => {
    if (!input.trim()) {
      setResults({})
      return
    }

    const value = parseFloat(input)
    if (isNaN(value)) {
      setResults({})
      return
    }

    const newResults: Record<string, string> = {}
    units.forEach((unit) => {
      if (unit !== fromUnit) {
        const converted = convertTemperature(value, fromUnit, unit)
        newResults[unit] = converted.toFixed(2)
      } else {
        newResults[unit] = value.toString()
      }
    })
    setResults(newResults)
  }, [input, fromUnit])

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
          <CardTitle>Input</CardTitle>
          <CardDescription>Enter temperature value</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-unit">From Unit</Label>
            <select
              id="from-unit"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit} ({unit === "Celsius" ? "°C" : unit === "Fahrenheit" ? "°F" : unit === "Kelvin" ? "K" : unit})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="input">Temperature</Label>
            <Input
              id="input"
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter temperature..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Converted Values</CardTitle>
          <CardDescription>All temperature scales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {units.map((unit) => (
            <div key={unit} className="space-y-2">
              <Label>{unit}</Label>
              <div className="flex gap-2">
                <Input
                  value={results[unit] || ""}
                  readOnly
                  className="font-mono"
                />
                <button
                  onClick={() => copyToClipboard(results[unit] || "")}
                  disabled={!results[unit]}
                  className="px-3 border rounded-md hover:bg-accent disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
