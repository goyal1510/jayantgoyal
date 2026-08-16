"use client"

import * as React from "react"
import { FileFolderIcon } from "@/components/file-manager/file-icons"
import { cn } from "@jayant/web-ui/lib/utils"
import { Spinner } from "@jayant/web-ui/spinner"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface FileThumbnailProps {
  file: DirectoryListingItem
  size?: number
  className?: string
}

// Cache for thumbnail URLs to avoid refetching
const thumbnailCache = new Map<string, string>()

export function FileThumbnail({ file, size = 48, className }: FileThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const isImage = file.file_type === "image" || file.mime_type?.startsWith("image/")
  const canShowThumbnail = isImage && !file.is_directory

  const fetchThumbnail = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files/${file.id}`)
      const data = await response.json()

      if (data.success && data.file?.url) {
        // Convert to blob URL so the signed URL can't be copied
        // Blob URLs are only valid in the current tab and can't be shared
        const imageResponse = await fetch(data.file.url)
        const blob = await imageResponse.blob()
        const blobUrl = URL.createObjectURL(blob)

        thumbnailCache.set(file.id, blobUrl)
        setThumbnailUrl(blobUrl)
      } else {
        setError(true)
      }
    } catch (err) {
      console.error("Failed to fetch thumbnail:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [file.id])

  // Fetch thumbnail URL when component mounts and is visible
  React.useEffect(() => {
    if (!canShowThumbnail) return

    // Check cache first
    const cached = thumbnailCache.get(file.id)
    if (cached) {
      setThumbnailUrl(cached)
      return
    }

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !thumbnailUrl && !loading && !error) {
            fetchThumbnail()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [file.id, canShowThumbnail, thumbnailUrl, loading, error, fetchThumbnail])

  // Show icon for directories, non-images, or on error
  if (file.is_directory || !canShowThumbnail || error) {
    return (
      <FileFolderIcon
        isFolder={file.is_directory}
        name={file.file_name}
        size={size}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-md bg-muted/30",
        className
      )}
      style={{ width: size * 1.5, height: size * 1.5 }}
    >
      {thumbnailUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={thumbnailUrl}
          alt={file.display_name || file.file_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        // Show icon while loading
        <FileFolderIcon
          isFolder={false}
          name={file.file_name}
          size={size * 0.6}
        />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  )
}
