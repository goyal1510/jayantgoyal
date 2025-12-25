"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegexTesterPage() {
  const tool = getToolByPath("/regex-tester")
  const [pattern, setPattern] = React.useState("")
  const [testText, setTestText] = React.useState("")
  const [flags, setFlags] = React.useState("g")
  const [matches, setMatches] = React.useState<string[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!pattern.trim() || !testText.trim()) {
      setMatches([])
      setError("")
      return
    }

    try {
      const regex = new RegExp(pattern, flags)
      const foundMatches = testText.match(regex) || []
      setMatches(foundMatches)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regex pattern")
      setMatches([])
    }
  }, [pattern, testText, flags])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Regex Pattern</CardTitle>
          <CardDescription>Enter regular expression</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pattern">Pattern</Label>
            <Input
              id="pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="/pattern/flags"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flags">Flags</Label>
            <Input
              id="flags"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="g, i, m, s, u, y"
            />
            <p className="text-xs text-muted-foreground">
              g=global, i=ignoreCase, m=multiline, s=dotAll, u=unicode, y=sticky
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Text</CardTitle>
            <CardDescription>Text to test against</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test..."
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>Found matches</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : matches.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Found {matches.length} match(es):</p>
                <div className="space-y-1 max-h-[250px] overflow-y-auto">
                  {matches.map((match, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm font-mono">
                      {match}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No matches found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
