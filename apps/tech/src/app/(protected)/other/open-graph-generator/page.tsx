"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

export default function OpenGraphGeneratorPage() {
  const tool = getToolByPath("/other/open-graph-generator")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [image, setImage] = React.useState("")
  const [siteName, setSiteName] = React.useState("")
  const [html, setHtml] = React.useState("")

  React.useEffect(() => {
    const tags: string[] = []
    if (title) tags.push(`<meta property="og:title" content="${title}" />`)
    if (description) tags.push(`<meta property="og:description" content="${description}" />`)
    if (url) tags.push(`<meta property="og:url" content="${url}" />`)
    if (image) tags.push(`<meta property="og:image" content="${image}" />`)
    if (siteName) tags.push(`<meta property="og:site_name" content="${siteName}" />`)
    if (title) tags.push(`<meta name="twitter:card" content="summary_large_image" />`)
    if (title) tags.push(`<meta name="twitter:title" content="${title}" />`)
    if (description) tags.push(`<meta name="twitter:description" content="${description}" />`)
    if (image) tags.push(`<meta name="twitter:image" content="${image}" />`)
    
    setHtml(tags.join("\n"))
  }, [title, description, url, image, siteName])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(html)
    toast.success("HTML copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Open Graph Details</CardTitle>
          <CardDescription>Enter metadata information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page Title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Page description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sitename">Site Name</Label>
            <Input
              id="sitename"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Site Name"
            />
          </div>
        </CardContent>
      </Card>

      {html && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated HTML</CardTitle>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={html}
              readOnly
              className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
