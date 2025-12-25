"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

function jsonDiff(obj1: any, obj2: any, path: string = ""): string[] {
  const diffs: string[] = []
  
  const keys1 = Object.keys(obj1 || {})
  const keys2 = Object.keys(obj2 || {})
  const allKeys = new Set([...keys1, ...keys2])
  
  allKeys.forEach((key) => {
    const currentPath = path ? `${path}.${key}` : key
    const val1 = obj1?.[key]
    const val2 = obj2?.[key]
    
    if (!(key in obj1)) {
      diffs.push(`+ ${currentPath}: ${JSON.stringify(val2)}`)
    } else if (!(key in obj2)) {
      diffs.push(`- ${currentPath}: ${JSON.stringify(val1)}`)
    } else if (typeof val1 === "object" && typeof val2 === "object" && val1 !== null && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
      diffs.push(...jsonDiff(val1, val2, currentPath))
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      diffs.push(`~ ${currentPath}: ${JSON.stringify(val1)} → ${JSON.stringify(val2)}`)
    }
  })
  
  return diffs
}

export default function JSONDiffPage() {
  const tool = getToolByPath("/json-diff")
  const [json1, setJson1] = React.useState("")
  const [json2, setJson2] = React.useState("")
  const [diffs, setDiffs] = React.useState<string[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!json1.trim() || !json2.trim()) {
      setDiffs([])
      setError("")
      return
    }

    try {
      const obj1 = JSON.parse(json1)
      const obj2 = JSON.parse(json2)
      const differences = jsonDiff(obj1, obj2)
      setDiffs(differences)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON")
      setDiffs([])
    }
  }, [json1, json2])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>JSON 1</CardTitle>
            <CardDescription>First JSON object</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={json1}
              onChange={(e) => setJson1(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JSON 2</CardTitle>
            <CardDescription>Second JSON object</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={json2}
              onChange={(e) => setJson2(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {diffs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Differences</CardTitle>
            <CardDescription>Found {diffs.length} difference(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {diffs.map((diff, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm font-mono ${
                    diff.startsWith("+") ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                    diff.startsWith("-") ? "bg-red-500/20 text-red-700 dark:text-red-400" :
                    "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {diff}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
