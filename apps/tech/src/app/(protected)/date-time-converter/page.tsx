"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  const ms = String(date.getMilliseconds()).padStart(3, "0")
  const timezone = -date.getTimezoneOffset() / 60
  const tzSign = timezone >= 0 ? "+" : "-"
  const tzHours = String(Math.abs(timezone)).padStart(2, "0")

  switch (format) {
    case "ISO 8601":
      return date.toISOString()
    case "Unix Timestamp":
      return Math.floor(date.getTime() / 1000).toString()
    case "Unix Timestamp (ms)":
      return date.getTime().toString()
    case "RFC 2822":
      return date.toUTCString()
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`
    case "YYYY-MM-DD HH:mm:ss":
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    case "DD-MM-YYYY HH:mm:ss":
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
    default:
      return date.toString()
  }
}

export default function DateTimeConverterPage() {
  const tool = getToolByPath("/date-time-converter")
  const [input, setInput] = React.useState("")
  const [inputFormat, setInputFormat] = React.useState("ISO 8601")
  const [outputFormat, setOutputFormat] = React.useState("Unix Timestamp")
  const [output, setOutput] = React.useState("")

  const formats = [
    "ISO 8601",
    "Unix Timestamp",
    "Unix Timestamp (ms)",
    "RFC 2822",
    "YYYY-MM-DD",
    "DD/MM/YYYY",
    "MM/DD/YYYY",
    "YYYY-MM-DD HH:mm:ss",
    "DD-MM-YYYY HH:mm:ss",
  ]

  const convert = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      let date: Date

      if (inputFormat === "Unix Timestamp") {
        date = new Date(parseInt(input) * 1000)
      } else if (inputFormat === "Unix Timestamp (ms)") {
        date = new Date(parseInt(input))
      } else {
        date = new Date(input)
      }

      if (isNaN(date.getTime())) {
        setOutput("Invalid date")
        return
      }

      const result = formatDate(date, outputFormat)
      setOutput(result)
    } catch (error) {
      setOutput("Conversion failed")
    }
  }, [input, inputFormat, outputFormat])

  React.useEffect(() => {
    convert()
  }, [convert])

  const useCurrentTime = () => {
    const now = new Date()
    setInput(now.toISOString())
    setInputFormat("ISO 8601")
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Enter date/time to convert</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-format">Input Format</Label>
              <select
                id="input-format"
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {formats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="input">Date/Time</Label>
              <Input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter date/time..."
              />
            </div>

            <Button variant="outline" onClick={useCurrentTime} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Use Current Time
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>Converted date/time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <select
                id="output-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {formats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Result</Label>
              <div className="flex gap-2">
                <Input
                  value={output}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  disabled={!output}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
