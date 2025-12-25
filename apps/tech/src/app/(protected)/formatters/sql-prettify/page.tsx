"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function prettifySQL(sql: string): string {
  // Simple SQL formatter
  const keywords = [
    "SELECT", "FROM", "WHERE", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN",
    "GROUP BY", "ORDER BY", "HAVING", "INSERT", "UPDATE", "DELETE", "CREATE",
    "ALTER", "DROP", "TABLE", "INDEX", "VIEW", "AS", "ON", "AND", "OR", "NOT",
    "IN", "EXISTS", "UNION", "ALL", "DISTINCT", "COUNT", "SUM", "AVG", "MAX", "MIN"
  ]

  let formatted = sql.trim()
  
  // Add newlines before keywords
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    formatted = formatted.replace(regex, `\n${keyword}`)
  })

  // Clean up multiple newlines
  formatted = formatted.replace(/\n\s*\n/g, "\n")
  
  // Add proper indentation
  const lines = formatted.split("\n")
  let indent = 0
  const formattedLines = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return ""
    
    // Decrease indent for closing keywords
    if (trimmed.match(/^(END|ELSE|ELSEIF)/i)) {
      indent = Math.max(0, indent - 1)
    }
    
    const indented = "  ".repeat(indent) + trimmed
    
    // Increase indent for opening keywords
    if (trimmed.match(/^(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|ALTER|IF|CASE)/i)) {
      indent++
    }
    
    return indented
  })

  return formattedLines.filter(l => l).join("\n")
}

export default function SQLPrettifyPage() {
  const tool = getToolByPath("/formatters/sql-prettify")
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")

  const prettify = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      const formatted = prettifySQL(input)
      setOutput(formatted)
    } catch (error) {
      setOutput("Failed to prettify SQL")
    }
  }, [input])

  React.useEffect(() => {
    prettify()
  }, [prettify])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast.success("Formatted SQL copied to clipboard")
  }
  
  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SQL Input</CardTitle>
            <CardDescription>Enter or paste SQL to format</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="SELECT * FROM users WHERE id = 1"
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Formatted SQL</CardTitle>
                <CardDescription>Prettified output</CardDescription>
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
              placeholder="Formatted SQL will appear here..."
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
