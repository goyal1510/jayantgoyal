"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, X, FileIcon, AlertCircle, Replace, Copy, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Maximum file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024

interface UploadFile {
  id: string
  file: File
  error?: string
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  directoryPath: string
  onSuccess?: () => void
}

interface ConflictInfo {
  file: File
  existingFile: {
    id: string
    name: string
    size: number
    updated_at: string
  }
}

type ConflictResolution = "replace" | "keep" | "both"

// Conflict resolution dialog component
function ConflictDialog({
  conflict,
  onResolve,
}: {
  conflict: ConflictInfo | null
  onResolve: (resolution: ConflictResolution | null) => void
}) {
  if (!conflict) return null

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Dialog open={!!conflict} onOpenChange={() => onResolve(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            File Already Exists
          </DialogTitle>
          <DialogDescription>
            A file named <span className="font-medium">{conflict.file.name}</span> already exists in this directory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">Existing file:</p>
            <p className="text-xs text-muted-foreground">
              Size: {formatFileSize(conflict.existingFile.size)} • Modified: {formatDate(conflict.existingFile.updated_at)}
            </p>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">New file:</p>
            <p className="text-xs text-muted-foreground">
              Size: {formatFileSize(conflict.file.size)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => onResolve("replace")}
          >
            <Replace className="h-4 w-4" />
            Keep Latest (Replace existing)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onResolve("keep")}
          >
            <SkipForward className="h-4 w-4" />
            Keep Previous (Skip upload)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onResolve("both")}
          >
            <Copy className="h-4 w-4" />
            Keep Both (Rename new file)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Upload a single file using direct upload to Supabase Storage
async function uploadSingleFile(
  file: File,
  directoryPath: string,
  overwrite: boolean = false,
  rename: boolean = false
): Promise<{ success: boolean; error?: string; conflict?: ConflictInfo }> {
  try {
    // Step 1: Get signed upload URL from our API
    const signedUrlResponse = await fetch("/api/files/upload/signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        directoryPath,
        overwrite,
        rename,
      }),
    })

    const signedUrlData = await signedUrlResponse.json()

    if (!signedUrlResponse.ok) {
      // Check if it's a conflict error
      if (signedUrlResponse.status === 409 && signedUrlData.code === "FILE_EXISTS") {
        return {
          success: false,
          conflict: {
            file,
            existingFile: signedUrlData.existingFile,
          },
        }
      }
      return { success: false, error: signedUrlData.error || "Failed to get upload URL" }
    }

    const { uploadUrl, uploadData } = signedUrlData

    // Step 2: Upload file directly to Supabase Storage using the signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Direct upload failed:", errorText)
      return { success: false, error: "Failed to upload file to storage" }
    }

    // Step 3: Complete the upload by creating the file record
    const completeResponse = await fetch("/api/files/upload/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(uploadData),
    })

    const completeData = await completeResponse.json()

    if (!completeResponse.ok || !completeData.success) {
      return { success: false, error: completeData.error || "Failed to complete upload" }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Upload failed" }
  }
}

export function UploadDialog({
  open,
  onOpenChange,
  directoryPath,
  onSuccess,
}: UploadDialogProps) {
  const [files, setFiles] = React.useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [conflict, setConflict] = React.useState<ConflictInfo | null>(null)
  const [conflictResolver, setConflictResolver] = React.useState<((resolution: ConflictResolution | null) => void) | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dropZoneRef = React.useRef<HTMLDivElement>(null)

  // Reset state when dialog closes (but not while uploading)
  React.useEffect(() => {
    if (!open && !isUploading) {
      setFiles([])
      setIsDragging(false)
    }
  }, [open, isUploading])

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

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

  // Wait for conflict resolution from user
  const waitForConflictResolution = (conflictInfo: ConflictInfo): Promise<ConflictResolution | null> => {
    return new Promise((resolve) => {
      setConflict(conflictInfo)
      setConflictResolver(() => resolve)
    })
  }

  const handleConflictResolve = (resolution: ConflictResolution | null) => {
    if (conflictResolver) {
      conflictResolver(resolution)
    }
    setConflict(null)
    setConflictResolver(null)
  }

  const handleUpload = async () => {
    const validFiles = files.filter(f => !f.error)
    if (validFiles.length === 0) return

    setIsUploading(true)
    onOpenChange(false) // Close upload dialog but keep component mounted

    const totalFiles = validFiles.length
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    const toastId = toast.loading(
      `Uploading ${totalFiles} file${totalFiles > 1 ? "s" : ""}...`,
      { duration: Infinity }
    )

    for (let i = 0; i < validFiles.length; i++) {
      const currentFile = validFiles[i]!

      toast.loading(
        `Uploading ${i + 1}/${totalFiles}: ${currentFile.file.name}`,
        { id: toastId }
      )

      // First attempt
      let result = await uploadSingleFile(currentFile.file, directoryPath)

      // Handle conflict
      if (result.conflict) {
        const resolution = await waitForConflictResolution(result.conflict)

        if (resolution === "replace") {
          result = await uploadSingleFile(currentFile.file, directoryPath, true, false)
        } else if (resolution === "both") {
          result = await uploadSingleFile(currentFile.file, directoryPath, false, true)
        } else {
          // Skip (keep previous or cancelled)
          skippedCount++
          continue
        }
      }

      if (result.success) {
        successCount++
      } else if (result.error) {
        errorCount++
        console.error(`Failed to upload ${currentFile.file.name}:`, result.error)
      }
    }

    setIsUploading(false)

    // Show final result
    if (errorCount === 0 && skippedCount === 0 && successCount > 0) {
      toast.success(
        `${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`,
        { id: toastId, duration: 3000 }
      )
    } else if (successCount === 0 && errorCount > 0) {
      toast.error(
        `Failed to upload ${errorCount} file${errorCount > 1 ? "s" : ""}`,
        { id: toastId, duration: 5000 }
      )
    } else if (successCount === 0 && skippedCount > 0 && errorCount === 0) {
      toast.info(
        `${skippedCount} file${skippedCount > 1 ? "s" : ""} skipped`,
        { id: toastId, duration: 3000 }
      )
    } else {
      const parts = []
      if (successCount > 0) parts.push(`${successCount} uploaded`)
      if (skippedCount > 0) parts.push(`${skippedCount} skipped`)
      if (errorCount > 0) parts.push(`${errorCount} failed`)
      toast.info(parts.join(", "), { id: toastId, duration: 4000 })
    }

    // Refresh file list if any files were uploaded
    if (successCount > 0 && onSuccess) {
      onSuccess()
    }

    // Clear files after upload completes
    setFiles([])
  }

  const validCount = files.filter(f => !f.error).length
  const hasFiles = files.length > 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Files
            </DialogTitle>
            <DialogDescription>
              Upload files to {directoryPath === "/" ? "root" : directoryPath}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              ref={dropZoneRef}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-4 sm:p-8 transition-colors",
                "flex flex-col items-center justify-center gap-2 cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Upload className={cn("h-8 w-8 sm:h-10 sm:w-10", isDragging ? "text-primary" : "text-muted-foreground")} />
              <div className="text-center">
                <p className="text-sm sm:text-base font-medium">
                  {isDragging ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  or tap to browse (max 25MB per file)
                </p>
              </div>
            </div>

            {/* File List */}
            {hasFiles && (
              <ScrollArea className="h-[150px] sm:h-[200px] rounded-md border p-2">
                <div className="space-y-2">
                  {files.map((uploadFile) => (
                    <div
                      key={uploadFile.id}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 p-2 rounded-md",
                        uploadFile.error && "bg-destructive/10"
                      )}
                    >
                      {uploadFile.error ? (
                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                      ) : (
                        <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{uploadFile.file.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadFile.file.size)}
                          </p>
                          {uploadFile.error && (
                            <p className="text-xs text-destructive truncate">{uploadFile.error}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(uploadFile.id)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={validCount === 0} className="w-full sm:w-auto">
                Upload {validCount > 0 && `(${validCount})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Dialog - stays mounted even when upload dialog closes */}
      <ConflictDialog conflict={conflict} onResolve={handleConflictResolve} />
    </>
  )
}
