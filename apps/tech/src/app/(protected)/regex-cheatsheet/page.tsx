"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const regexCheatsheet = [
  {
    category: "Character Classes",
    items: [
      { pattern: ".", description: "Any character except newline" },
      { pattern: "\\d", description: "Digit (0-9)" },
      { pattern: "\\D", description: "Not a digit" },
      { pattern: "\\w", description: "Word character (a-z, A-Z, 0-9, _)" },
      { pattern: "\\W", description: "Not a word character" },
      { pattern: "\\s", description: "Whitespace (space, tab, newline)" },
      { pattern: "\\S", description: "Not whitespace" },
      { pattern: "[abc]", description: "Any of a, b, or c" },
      { pattern: "[^abc]", description: "Not a, b, or c" },
      { pattern: "[a-z]", description: "Character range" },
    ],
  },
  {
    category: "Anchors",
    items: [
      { pattern: "^", description: "Start of string" },
      { pattern: "$", description: "End of string" },
      { pattern: "\\b", description: "Word boundary" },
      { pattern: "\\B", description: "Not word boundary" },
    ],
  },
  {
    category: "Quantifiers",
    items: [
      { pattern: "*", description: "0 or more" },
      { pattern: "+", description: "1 or more" },
      { pattern: "?", description: "0 or 1" },
      { pattern: "{n}", description: "Exactly n times" },
      { pattern: "{n,}", description: "n or more times" },
      { pattern: "{n,m}", description: "Between n and m times" },
    ],
  },
  {
    category: "Groups",
    items: [
      { pattern: "(abc)", description: "Capture group" },
      { pattern: "(?:abc)", description: "Non-capturing group" },
      { pattern: "(?<name>abc)", description: "Named capture group" },
      { pattern: "\\1", description: "Backreference to group 1" },
    ],
  },
  {
    category: "Alternation",
    items: [
      { pattern: "a|b", description: "a or b" },
    ],
  },
  {
    category: "Flags",
    items: [
      { pattern: "g", description: "Global - find all matches" },
      { pattern: "i", description: "Case insensitive" },
      { pattern: "m", description: "Multiline" },
      { pattern: "s", description: "Dot matches newline" },
      { pattern: "u", description: "Unicode" },
      { pattern: "y", description: "Sticky" },
    ],
  },
]

export default function RegexCheatsheetPage() {
  const tool = getToolByPath("/regex-cheatsheet")

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        {regexCheatsheet.map((section) => (
          <Card key={section.category}>
            <CardHeader>
              <CardTitle>{section.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded min-w-[80px] text-center">
                      {item.pattern}
                    </code>
                    <p className="text-sm flex-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
