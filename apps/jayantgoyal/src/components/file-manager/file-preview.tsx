"use client"

import { FileIcon, AlertCircle } from "lucide-react"

export interface FileDetails {
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

export function FilePreview({ file, url }: { file: FileDetails; url: string }) {
  const mimeType = file.mime_type

  // Images
  if (mimeType.startsWith("image/")) {
    return (
      <div className="flex items-center justify-center w-full h-[60vh] sm:h-[80vh] bg-muted/30 rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
