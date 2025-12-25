"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

export default function HTMLWYSIWYGEditorPage() {
  const tool = getToolByPath("/html-wysiwyg-editor")
  const [html, setHtml] = React.useState("<p>Start editing...</p>")
  const contentEditableRef = React.useRef<HTMLDivElement>(null)

  const getHTML = () => {
    return contentEditableRef.current?.innerHTML || ""
  }

  const copyToClipboard = () => {
    const htmlContent = getHTML()
    navigator.clipboard.writeText(htmlContent)
    toast.success("HTML copied to clipboard")
  }

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    contentEditableRef.current?.focus()
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Toolbar</CardTitle>
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy HTML
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 border-b pb-2">
            <Button variant="outline" size="sm" onClick={() => formatText("bold")}>
              <strong>B</strong>
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("italic")}>
              <em>I</em>
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("underline")}>
              <u>U</u>
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("formatBlock", "<h1>")}>
              H1
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("formatBlock", "<h2>")}>
              H2
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("formatBlock", "<p>")}>
              P
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("insertUnorderedList")}>
              • List
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("insertOrderedList")}>
              1. List
            </Button>
            <Button variant="outline" size="sm" onClick={() => formatText("createLink", prompt("Enter URL:") || undefined)}>
              Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>WYSIWYG HTML editor</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={contentEditableRef}
            contentEditable
            dangerouslySetInnerHTML={{ __html: html }}
            onInput={(e) => setHtml(e.currentTarget.innerHTML)}
            className="min-h-[400px] border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ whiteSpace: "pre-wrap" }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated HTML</CardTitle>
          <CardDescription>Source code</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={html}
            onChange={(e) => {
              setHtml(e.target.value)
              if (contentEditableRef.current) {
                contentEditableRef.current.innerHTML = e.target.value
              }
            }}
            className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
          />
        </CardContent>
      </Card>
    </div>
  )
}
