"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Upload, Download } from "lucide-react"
import { toast } from "sonner"

export default function Base64FileConverterPage() {
  const tool = getToolByPath("/converters/base64-file-converter")
  const [file, setFile] = React.useState<File | null>(null)
  const [base64, setBase64] = React.useState("")
  const [fileName, setFileName] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFileName(selectedFile.name)
    setIsProcessing(true)

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        // Remove data URL prefix if present
        const base64String = result.includes(",") ? result.split(",")[1] ?? "" : result
        setBase64(base64String)
        setIsProcessing(false)
      }
      reader.onerror = () => {
        toast.error("Failed to read file")
        setIsProcessing(false)
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      toast.error("Failed to process file")
      setIsProcessing(false)
    }
  }

  const handleBase64Input = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBase64(e.target.value)
  }

  const downloadFile = () => {
    if (!base64 || !fileName) {
      toast.error("No file data available")
      return
    }

    try {
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes])
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName || "download"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("File downloaded")
    } catch (error) {
      toast.error("Failed to download file")
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(base64)
    toast.success("Base64 copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>File Input</CardTitle>
            <CardDescription>Upload a file to convert</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">Select File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {file && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-semibold">Selected File:</p>
                <p className="text-sm text-muted-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            {isProcessing && (
              <p className="text-sm text-muted-foreground">Processing file...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Base64 Output</CardTitle>
            <CardDescription>Base64 encoded string</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Base64 String</Label>
              <textarea
                value={base64}
                onChange={handleBase64Input}
                placeholder="Paste Base64 string here or upload a file..."
                className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!base64}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Base64
              </Button>
              <Button
                variant="outline"
                onClick={downloadFile}
                disabled={!base64 || !fileName}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>

            {base64 && (
              <div className="text-sm text-muted-foreground">
                <p>Length: {base64.length} characters</p>
                {fileName && <p>File: {fileName}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
