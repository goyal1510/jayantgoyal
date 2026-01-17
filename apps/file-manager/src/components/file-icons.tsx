"use client"

import * as React from "react"
import {
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  FileCode,
  FileSpreadsheet,
  FileType,
  Folder,
  FolderOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type FileTypeCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "spreadsheet"
  | "code"
  | "archive"
  | "text"
  | "other"

export interface FileIconProps {
  type?: FileTypeCategory
  name?: string
  isFolder?: boolean
  isOpen?: boolean
  className?: string
  size?: number
}

/**
 * Get file type category from file name/extension
 */
export function getFileType(fileName: string): FileTypeCategory {
  const extension = fileName.split(".").pop()?.toLowerCase() || ""

  // Image types
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"].includes(extension)) {
    return "image"
  }

  // Video types
  if (["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"].includes(extension)) {
    return "video"
  }

  // Audio types
  if (["mp3", "wav", "flac", "aac", "ogg", "m4a"].includes(extension)) {
    return "audio"
  }

  // Document types
  if (["pdf", "doc", "docx", "rtf"].includes(extension)) {
    return "document"
  }

  // Spreadsheet types
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return "spreadsheet"
  }

  // Code types
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "scss",
      "json",
      "xml",
      "yaml",
      "yml",
      "py",
      "java",
      "cpp",
      "c",
      "go",
      "rs",
      "php",
      "rb",
      "swift",
      "kt",
      "sh",
      "bash",
      "zsh",
    ].includes(extension)
  ) {
    return "code"
  }

  // Archive types
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension)) {
    return "archive"
  }

  // Text types
  if (["txt", "md", "readme"].includes(extension)) {
    return "text"
  }

  return "other"
}

/**
 * File icon component that displays appropriate icon based on file type
 */
export function FileIcon({
  type,
  name,
  className,
  size = 20,
}: Omit<FileIconProps, "isFolder" | "isOpen">) {
  const fileType = type || (name ? getFileType(name) : "other")

  const iconMap: Record<FileTypeCategory, React.ComponentType<{ className?: string; size?: number }>> = {
    image: Image,
    video: Video,
    audio: Music,
    document: FileText,
    spreadsheet: FileSpreadsheet,
    code: FileCode,
    archive: Archive,
    text: FileType,
    other: File,
  }

  const Icon = iconMap[fileType]

  return <Icon className={cn("text-muted-foreground", className)} size={size} />
}

/**
 * Folder icon component
 */
export function FolderIcon({
  isOpen = false,
  className,
  size = 20,
}: Omit<FileIconProps, "type" | "name" | "isFolder"> & { isOpen?: boolean }) {
  const Icon = isOpen ? FolderOpen : Folder

  return (
    <Icon
      className={cn("text-yellow-500 dark:text-yellow-400", className)}
      size={size}
    />
  )
}

/**
 * Unified file/folder icon component
 */
export function FileFolderIcon({
  isFolder = false,
  isOpen = false,
  type,
  name,
  className,
  size = 20,
}: FileIconProps) {
  if (isFolder) {
    return <FolderIcon isOpen={isOpen} className={className} size={size} />
  }

  return <FileIcon type={type} name={name} className={className} size={size} />
}
