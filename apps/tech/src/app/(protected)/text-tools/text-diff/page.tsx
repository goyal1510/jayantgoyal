"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

function computeDiff(text1: string, text2: string): string {
  const lines1 = text1.split("\n")
  const lines2 = text2.split("\n")
  const maxLen = Math.max(lines1.length, lines2.length)
  let diff = ""

  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i]
    const line2 = lines2[i]

    if (line1 === undefined) {
      diff += `+ ${line2}\n`
    } else if (line2 === undefined) {
      diff += `- ${line1}\n`
    } else if (line1 === line2) {
      diff += `  ${line1}\n`
    } else {
      diff += `- ${line1}\n`
      diff += `+ ${line2}\n`
    }
  }

  return diff.trim()
}

export default function TextDiffPage() {
  const tool = getToolByPath("/text-tools/text-diff")
  const [text1, setText1] = React.useState("")
  const [text2, setText2] = React.useState("")
  const [diff, setDiff] = React.useState("")

  React.useEffect(() => {
    if (!text1.trim() && !text2.trim()) {
      setDiff("")
      return
    }
    setDiff(computeDiff(text1, text2))
  }, [text1, text2])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Text 1</CardTitle>
            <CardDescription>Original text</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="Enter first text..."
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Text 2</CardTitle>
            <CardDescription>Text to compare</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="Enter second text..."
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diff Result</CardTitle>
          <CardDescription>Differences highlighted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono whitespace-pre-wrap">
            {diff.split("\n").map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("+")
                    ? "bg-green-500/20 text-green-700 dark:text-green-400"
                    : line.startsWith("-")
                    ? "bg-red-500/20 text-red-700 dark:text-red-400"
                    : ""
                }
              >
                {line}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
