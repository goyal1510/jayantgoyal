"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function PDFSignatureCheckerPage() {
  const tool = getToolByPath("/parsers-validators/pdf-signature-checker")
  const [file, setFile] = React.useState<File | null>(null)
  const [status, setStatus] = React.useState<"idle" | "checking" | "signed" | "unsigned" | "error">("idle")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== "application/pdf") {
      toast.error("Please select a PDF file")
      return
    }

    setFile(selectedFile)
    setStatus("checking")

    // Simple check - in production use a proper PDF library
    const reader = new FileReader()
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer)
      const text = Array.from(uint8Array.slice(0, 1000))
        .map(b => String.fromCharCode(b))
        .join("")

      // Check for signature markers (simplified)
      if (text.includes("/Sig") || text.includes("/ByteRange") || text.includes("/Contents")) {
        setStatus("signed")
      } else {
        setStatus("unsigned")
      }
    }
    reader.onerror = () => {
      setStatus("error")
      toast.error("Failed to read PDF file")
    }
    reader.readAsArrayBuffer(selectedFile)
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>PDF File</CardTitle>
          <CardDescription>Upload PDF to check signatures</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-file">Select PDF File</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
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
        </CardContent>
      </Card>

      {status !== "idle" && (
        <Card>
          <CardHeader>
            <CardTitle>Signature Status</CardTitle>
            <CardDescription>PDF signature verification</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "checking" && (
              <p className="text-muted-foreground">Checking PDF for signatures...</p>
            )}
            {status === "signed" && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">PDF contains signatures</span>
              </div>
            )}
            {status === "unsigned" && (
              <div className="flex items-center gap-2 text-orange-500">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">PDF does not appear to be signed</span>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Error checking PDF</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Note: This is a basic check. For production use, implement proper PDF signature validation using a PDF library.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
