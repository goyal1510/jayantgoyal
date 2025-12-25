"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const [localPart, domain] = trimmed.split("@")
  
  if (!localPart || !domain) return trimmed
  
  // Remove dots from local part (Gmail style)
  const normalizedLocal = localPart.replace(/\./g, "")
  
  // Remove everything after + (plus addressing)
  const plusIndex = normalizedLocal.indexOf("+")
  const finalLocal = plusIndex > 0 ? normalizedLocal.slice(0, plusIndex) : normalizedLocal
  
  return `${finalLocal}@${domain}`
}

export default function EmailNormalizerPage() {
  const tool = getToolByPath("/email-normalizer")
  const [input, setInput] = React.useState("")
  const [normalized, setNormalized] = React.useState("")

  React.useEffect(() => {
    if (!input.trim()) {
      setNormalized("")
      return
    }
    setNormalized(normalizeEmail(input))
  }, [input])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(normalized)
    toast.success("Normalized email copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email Input</CardTitle>
            <CardDescription>Enter email to normalize</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="user.name+tag@example.com"
              type="email"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Normalized Email</CardTitle>
                <CardDescription>Standardized format</CardDescription>
              </div>
              {normalized && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Input
              value={normalized}
              readOnly
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Normalized: lowercase, dots removed, plus addressing removed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
