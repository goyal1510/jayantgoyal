"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog"
import { Button } from "@repo/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, X, FileIcon, AlertCircle } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "sonner"
import { formatFileSize } from "@/lib/file-manager/format-utils"
import { uploadSingleFile } from "@/components/file-manager/upload-single-file"
import { UploadConflictDialog } from "@/components/file-manager/upload-conflict-dialog"
import type { UploadConflictInfo, UploadConflictResolution } from "@/components/file-manager/upload-conflict-dialog"
import { useUploadFiles } from "@/components/file-manager/use-upload-files"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  directoryPath: string
  onSuccess?: () => void
}

export function UploadDialog({
  open,
  onOpenChange,
  directoryPath,
  onSuccess,
}: UploadDialogProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [conflict, setConflict] = React.useState<UploadConflictInfo | null>(null)
  const [conflictResolver, setConflictResolver] = React.useState<((resolution: UploadConflictResolution | null) => void) | null>(null)

  const {
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
  } = useUploadFiles(open, isUploading)

  const waitForConflictResolution = (conflictInfo: UploadConflictInfo): Promise<UploadConflictResolution | null> => {
    return new Promise((resolve) => {
      setConflict(conflictInfo)
      setConflictResolver(() => resolve)
    })
  }

  const handleConflictResolve = (resolution: UploadConflictResolution | null) => {
    if (conflictResolver) {
      conflictResolver(resolution)
    }
    setConflict(null)
    setConflictResolver(null)
  }

  const handleUpload = async () => {
    if (validFiles.length === 0) return

    setIsUploading(true)
    onOpenChange(false)

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

      let result = await uploadSingleFile(currentFile.file, directoryPath)

      if (result.conflict) {
        const resolution = await waitForConflictResolution(result.conflict)

        if (resolution === "replace") {
          result = await uploadSingleFile(currentFile.file, directoryPath, true, false)
        } else if (resolution === "both") {
          result = await uploadSingleFile(currentFile.file, directoryPath, false, true)
        } else {
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

    if (errorCount === 0 && skippedCount === 0 && successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`, { id: toastId, duration: 3000 })
    } else if (successCount === 0 && errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} file${errorCount > 1 ? "s" : ""}`, { id: toastId, duration: 5000 })
    } else if (successCount === 0 && skippedCount > 0 && errorCount === 0) {
      toast.info(`${skippedCount} file${skippedCount > 1 ? "s" : ""} skipped`, { id: toastId, duration: 3000 })
    } else {
      const parts = []
      if (successCount > 0) parts.push(`${successCount} uploaded`)
      if (skippedCount > 0) parts.push(`${skippedCount} skipped`)
      if (errorCount > 0) parts.push(`${errorCount} failed`)
      toast.info(parts.join(", "), { id: toastId, duration: 4000 })
    }

    if (successCount > 0 && onSuccess) {
      onSuccess()
    }

    clearFiles()
  }

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

      <UploadConflictDialog conflict={conflict} onResolve={handleConflictResolve} />
    </>
  )
}
