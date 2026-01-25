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
import { Copy, AlertCircle, Replace, SkipForward } from "lucide-react"
import { DirectoryPicker } from "@/components/file-manager/directory-picker"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface CopyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DirectoryListingItem | null
  onSuccess?: () => void
}

interface ConflictInfo {
  existingFile: {
    id: string
    name: string
    fileName: string
    path: string
    size: number
    updated_at: string
  }
}

type ConflictResolution = "replace" | "skip" | "rename"

// Conflict resolution dialog component
function ConflictDialog({
  conflict,
  fileName,
  onResolve,
}: {
  conflict: ConflictInfo | null
  fileName: string
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
            A file named <span className="font-medium">{fileName}</span> already exists at the destination.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">Existing file: <span className="font-normal">{conflict.existingFile.fileName}</span></p>
            <p className="text-xs text-muted-foreground">
              Path: {conflict.existingFile.path}
            </p>
            <p className="text-xs text-muted-foreground">
              Size: {formatFileSize(conflict.existingFile.size)} • Modified: {formatDate(conflict.existingFile.updated_at)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => onResolve("replace")}
          >
            <Replace className="h-4 w-4" />
            Replace existing
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onResolve("skip")}
          >
            <SkipForward className="h-4 w-4" />
            Cancel copy
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onResolve("rename")}
          >
            <Copy className="h-4 w-4" />
            Keep Both (Rename copied file)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CopyDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: CopyDialogProps) {
  const [targetPath, setTargetPath] = React.useState("/")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [conflict, setConflict] = React.useState<ConflictInfo | null>(null)
  const [conflictResolver, setConflictResolver] = React.useState<((resolution: ConflictResolution | null) => void) | null>(null)

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setTargetPath("/")
      setError(null)
      setConflict(null)
      setConflictResolver(null)
    }
  }, [open])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/files/${file.id}/copy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetPath,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a conflict error
        if (response.status === 409 && data.code === "FILE_EXISTS") {
          const resolution = await waitForConflictResolution({
            existingFile: data.existingFile,
          })

          if (resolution === "replace") {
            // Retry with overwrite flag
            const retryResponse = await fetch(`/api/files/${file.id}/copy`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                targetPath,
                overwrite: true,
              }),
            })

            const retryData = await retryResponse.json()
            if (!retryResponse.ok) {
              throw new Error(retryData.error || "Failed to copy")
            }
          } else if (resolution === "rename") {
            // Retry with rename flag
            const retryResponse = await fetch(`/api/files/${file.id}/copy`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                targetPath,
                rename: true,
              }),
            })

            const retryData = await retryResponse.json()
            if (!retryResponse.ok) {
              throw new Error(retryData.error || "Failed to copy")
            }
          } else {
            // Skip/Cancel - just close loading state
            setLoading(false)
            return
          }
        } else {
          throw new Error(data.error || "Failed to copy")
        }
      }

      // Success
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!file) return null

  // Cannot copy directories
  if (file.is_directory) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Copy Folder
            </DialogTitle>
            <DialogDescription>
              Folder copying is not currently supported. Please copy files individually.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Copy File
            </DialogTitle>
            <DialogDescription>
              Select a destination folder for the copy of &quot;{file.display_name || file.file_name}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <DirectoryPicker
                  value={targetPath}
                  onChange={setTargetPath}
                  disabled={loading}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                {targetPath && (
                  <p className="text-sm text-muted-foreground">
                    Copying to: <span className="font-mono">{targetPath}</span>
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Copying..." : "Copy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <ConflictDialog
        conflict={conflict}
        fileName={file.display_name || file.file_name}
        onResolve={handleConflictResolve}
      />
    </>
  )
}
