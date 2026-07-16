"use client"

import * as React from "react"

const MAX_FILE_SIZE = 25 * 1024 * 1024

export interface UploadFile {
  id: string
  file: File
  error?: string
}

export function useUploadFiles(open: boolean, isUploading: boolean) {
  const [files, setFiles] = React.useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dropZoneRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open && !isUploading) {
      setFiles([])
      setIsDragging(false)
    }
  }, [open, isUploading])

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    }
    return null
  }

  const addFiles = (newFiles: FileList | File[]) => {
    const filesToAdd: UploadFile[] = []
    for (const file of newFiles) {
      const error = validateFile(file)
      filesToAdd.push({
        id: generateId(),
        file,
        error: error || undefined,
      })
    }
    setFiles(prev => [...prev, ...filesToAdd])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const clearFiles = () => setFiles([])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
      e.target.value = ""
    }
  }

  const validCount = files.filter(f => !f.error).length
  const validFiles = files.filter(f => !f.error)

  return {
    files,
    isDragging,
    fileInputRef,
    dropZoneRef,
    validCount,
    validFiles,
    removeFile,
    clearFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
  }
}
