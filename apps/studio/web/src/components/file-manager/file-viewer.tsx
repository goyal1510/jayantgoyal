"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@jayant/web-ui/dialog"
import { Button } from "@jayant/web-ui/button"
import { Spinner } from "@jayant/web-ui/spinner"
import { AlertCircle, ChevronLeft, ChevronRight, Download } from "lucide-react"
import type { DirectoryListingItem } from "@/lib/file-manager/types"
import { FilePreview } from "@/components/file-manager/file-preview"
import type { FileDetails } from "@/components/file-manager/file-preview"

interface FileViewerProps {
  file: DirectoryListingItem | null
  files: DirectoryListingItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileChange: (file: DirectoryListingItem) => void
}

export function FileViewer({ file, files, open, onOpenChange, onFileChange }: FileViewerProps) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [fileDetails, setFileDetails] = React.useState<FileDetails | null>(null)

  const viewableFiles = React.useMemo(() =>
    files.filter(f => !f.is_directory),
    [files]
  )

  const currentIndex = React.useMemo(() => {
    if (!file) return -1
    return viewableFiles.findIndex(f => f.id === file.id)
  }, [file, viewableFiles])

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < viewableFiles.length - 1

  const goToPrev = React.useCallback(() => {
    if (hasPrev) {
      const prevFile = viewableFiles[currentIndex - 1]
      if (prevFile) {
        onFileChange(prevFile)
      }
    }
  }, [hasPrev, viewableFiles, currentIndex, onFileChange])

  const goToNext = React.useCallback(() => {
    if (hasNext) {
      const nextFile = viewableFiles[currentIndex + 1]
      if (nextFile) {
        onFileChange(nextFile)
      }
    }
  }, [hasNext, viewableFiles, currentIndex, onFileChange])

  const handleDownload = React.useCallback(async () => {
    if (!fileDetails) return

    try {
      const response = await fetch(fileDetails.url)
      const blob = await response.blob()

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = fileDetails.display_name || fileDetails.original_filename || fileDetails.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error("Download failed:", err)
    }
  }, [fileDetails])

  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goToPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, goToPrev, goToNext])

  React.useEffect(() => {
    if (open && file && !file.is_directory) {
      setLoading(true)
      setError(null)

      fetch(`/api/files/${file.id}`)
        .then(res => res.json())
        .then(async (data) => {
          if (data.success && data.file) {
            const mimeType = data.file.mime_type || ""
            if (mimeType.startsWith("image/")) {
              try {
                const imageResponse = await fetch(data.file.url)
                const blob = await imageResponse.blob()
                const blobUrl = URL.createObjectURL(blob)
                setFileDetails({
                  ...data.file,
                  url: blobUrl,
                  _blobUrl: true
                })
              } catch {
                setFileDetails(data.file)
              }
            } else {
              setFileDetails(data.file)
            }
          } else {
            setError(data.error || "Failed to load file")
          }
        })
        .catch(err => {
          console.error("Error fetching file:", err)
          setError("Failed to load file")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, file])

  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        if (fileDetails?.url && (fileDetails as unknown as { _blobUrl?: boolean })._blobUrl) {
          URL.revokeObjectURL(fileDetails.url)
        }
        setFileDetails(null)
        setError(null)
        setLoading(true)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open, fileDetails])

  if (!file) return null

  const displayName = file.display_name || file.file_name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-[95vw] max-h-[90vh] sm:max-h-[95vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="truncate flex-1 text-sm sm:text-base">{displayName}</DialogTitle>
            <div className="flex items-center gap-2 ml-2">
              {viewableFiles.length > 1 && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {currentIndex + 1} / {viewableFiles.length}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading || !fileDetails}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[60vh] sm:min-h-[80vh] relative">
          {viewableFiles.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 hover:bg-background shadow-md disabled:opacity-30"
              onClick={goToPrev}
              disabled={!hasPrev}
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}

          {viewableFiles.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 hover:bg-background shadow-md disabled:opacity-30"
              onClick={goToNext}
              disabled={!hasNext}
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}

          <div className="h-full overflow-auto px-8 sm:px-12">
            {loading ? (
              <div className="flex items-center justify-center h-[60vh] sm:h-[80vh]">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-4 h-[60vh] sm:h-[80vh] bg-destructive/10 rounded-lg px-4">
                <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive" />
                <p className="text-base sm:text-lg font-medium text-destructive text-center">Error loading file</p>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">{error}</p>
              </div>
            ) : fileDetails ? (
              <FilePreview file={fileDetails} url={fileDetails.url} />
            ) : (
              <div className="flex items-center justify-center h-[60vh] sm:h-[80vh]">
                <Spinner size="lg" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
