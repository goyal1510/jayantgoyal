"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function SlugifyStringPage() {
  const tool = getToolByPath("/text-tools/slugify-string")
  const [input, setInput] = React.useState("")
  const [slug, setSlug] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setSlug("")
      return
    }
    setSlug(slugify(input))
  }, [input])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(slug)
    toast.success("Slug copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
            <CardDescription>Enter text to slugify</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text..."
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Slug</CardTitle>
                <CardDescription>URL-safe slug</CardDescription>
              </div>
              {slug && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Input
              value={slug}
              readOnly
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Safe for use in URLs, filenames, and IDs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
