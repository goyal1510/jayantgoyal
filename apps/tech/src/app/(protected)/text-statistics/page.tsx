"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

function getTextStats(text: string) {
  const chars = text.length
  const charsNoSpaces = text.replace(/\s/g, "").length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text.split("\n").length
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length
  const bytes = new TextEncoder().encode(text).length
  
  return {
    characters: chars,
    charactersNoSpaces: charsNoSpaces,
    words,
    lines,
    paragraphs,
    sentences,
    bytes,
  }
}

export default function TextStatisticsPage() {
  const tool = getToolByPath("/text-statistics")
  const [input, setInput] = React.useState("")
  const stats = React.useMemo(() => getTextStats(input), [input])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
            <CardDescription>Enter or paste text to analyze</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Text analysis results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Characters</Label>
                <p className="text-2xl font-bold">{stats.characters.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Characters (no spaces)</Label>
                <p className="text-2xl font-bold">{stats.charactersNoSpaces.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Words</Label>
                <p className="text-2xl font-bold">{stats.words.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Lines</Label>
                <p className="text-2xl font-bold">{stats.lines.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Paragraphs</Label>
                <p className="text-2xl font-bold">{stats.paragraphs.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Sentences</Label>
                <p className="text-2xl font-bold">{stats.sentences.toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Size (bytes)</Label>
                <p className="text-2xl font-bold">{stats.bytes.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
