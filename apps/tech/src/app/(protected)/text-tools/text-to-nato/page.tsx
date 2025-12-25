"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

const NATO_ALPHABET: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo",
  F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliet",
  K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar",
  P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango",
  U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
  "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four",
  "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine",
}

const NATO_TO_CHAR: Record<string, string> = Object.fromEntries(
  Object.entries(NATO_ALPHABET).map(([char, word]) => [word.toUpperCase(), char])
)

function textToNATO(text: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((char) => {
      if (char === " ") return " "
      return NATO_ALPHABET[char] || char
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

function natoToText(nato: string): string {
  const words = nato.split(/\s+/)
  return words
    .map((word) => {
      const upperWord = word.toUpperCase()
      return NATO_TO_CHAR[upperWord] || word
    })
    .join("")
}

export default function TextToNATOPage() {
  const tool = getToolByPath("/text-tools/text-to-nato")
  const [mode, setMode] = React.useState<"to-nato" | "from-nato">("to-nato")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      if (mode === "to-nato") {
        setOutput(textToNATO(input))
      } else {
        setOutput(natoToText(input))
      }
    } catch {
      setOutput("Conversion failed")
    }
  }, [input, mode])

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
                variant={mode === "to-nato" ? "default" : "outline"}
                onClick={() => {
                  setMode("to-nato")
                  setOutput("")
                }}
              >
                Text → NATO
              </Button>
              <Button
                variant={mode === "from-nato" ? "default" : "outline"}
                onClick={() => {
                  setMode("from-nato")
                  setOutput("")
                }}
              >
                NATO → Text
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "to-nato" ? "Text Input" : "NATO Input"}</CardTitle>
            <CardDescription>
              {mode === "to-nato" ? "Enter text to convert" : "Enter NATO alphabet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "to-nato" ? "Enter text..." : "Alpha Bravo Charlie..."}
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === "to-nato" ? "NATO Output" : "Text Output"}</CardTitle>
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
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
