"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SpinnerWithText } from "@/components/ui/spinner"
import { FileIcon, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import type { DirectoryListingItem } from "@/lib/types"

interface FileViewerProps {
  file: DirectoryListingItem | null
  files: DirectoryListingItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileChange: (file: DirectoryListingItem) => void
}

interface FileDetails {
  id: string
  name: string
  display_name: string | null
  original_filename: string
  path: string
  mime_type: string
  size_bytes: number
  file_type: string
  is_directory: boolean
  created_at: string
  updated_at: string
  url: string
}

// Get preview component based on mime type
function FilePreview({ file, url }: { file: FileDetails; url: string }) {
  const mimeType = file.mime_type

  // Images
  if (mimeType.startsWith("image/")) {
    return (
      <div className="flex items-center justify-center w-full h-[60vh] sm:h-[80vh] bg-muted/30 rounded-lg overflow-hidden">
        <img
          src={url}
          alt={file.display_name || file.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  // PDF
  if (mimeType === "application/pdf") {
    return (
      <iframe
        src={url}
        className="w-full h-[60vh] sm:h-[80vh] rounded-lg border"
        title={file.display_name || file.name}
      />
    )
  }

  // Video
  if (mimeType.startsWith("video/")) {
    return (
      <div className="flex items-center justify-center w-full h-[60vh] sm:h-[80vh] bg-black rounded-lg overflow-hidden">
        <video
          src={url}
          controls
          className="max-w-full max-h-full"
          autoPlay={false}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  // Audio
  if (mimeType.startsWith("audio/")) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 h-[60vh] sm:h-[80vh] bg-muted/30 rounded-lg px-4">
        <FileIcon className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground" />
        <p className="text-base sm:text-lg font-medium text-center truncate max-w-full">{file.display_name || file.name}</p>
        <audio src={url} controls className="w-full max-w-md">
          Your browser does not support the audio tag.
        </audio>
      </div>
    )
  }

  // Text/Code files - show in iframe
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/javascript"
  ) {
    return (
      <iframe
        src={url}
        className="w-full h-[60vh] sm:h-[80vh] rounded-lg border bg-white dark:bg-zinc-900"
        title={file.display_name || file.name}
      />
    )
  }

  // Not previewable
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-[60vh] sm:h-[80vh] bg-muted/30 rounded-lg px-4">
      <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
      <p className="text-base sm:text-lg font-medium text-center">Preview not available</p>
      <p className="text-xs sm:text-sm text-muted-foreground text-center">
        This file type ({mimeType}) cannot be previewed in the browser.
      </p>
    </div>
  )
}

export function FileViewer({ file, files, open, onOpenChange, onFileChange }: FileViewerProps) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [fileDetails, setFileDetails] = React.useState<FileDetails | null>(null)

  // Get only non-directory files for navigation
  const viewableFiles = React.useMemo(() =>
    files.filter(f => !f.is_directory),
    [files]
  )

  // Get current file index
  const currentIndex = React.useMemo(() => {
    if (!file) return -1
    return viewableFiles.findIndex(f => f.id === file.id)
  }, [file, viewableFiles])

  // Navigation handlers
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

  // Keyboard navigation
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

  // Fetch file details when file changes
  React.useEffect(() => {
    if (open && file && !file.is_directory) {
      setLoading(true)
      setError(null)

      fetch(`/api/files/${file.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.file) {
            setFileDetails(data.file)
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

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setFileDetails(null)
        setError(null)
        setLoading(true)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!file) return null

  const displayName = file.display_name || file.file_name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-[95vw] max-h-[90vh] sm:max-h-[95vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="truncate flex-1 text-sm sm:text-base">{displayName}</DialogTitle>
            {viewableFiles.length > 1 && (
              <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                {currentIndex + 1} / {viewableFiles.length}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Content with navigation */}
        <div className="flex-1 min-h-[60vh] sm:min-h-[80vh] relative">
          {/* Previous button */}
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

          {/* Next button */}
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

          {/* File content */}
          <div className="h-full overflow-auto px-8 sm:px-12">
            {loading ? (
              <div className="flex items-center justify-center h-[60vh] sm:h-[80vh]">
                <SpinnerWithText text="Loading file..." size="lg" />
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
                <SpinnerWithText text="Loading file..." size="lg" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
