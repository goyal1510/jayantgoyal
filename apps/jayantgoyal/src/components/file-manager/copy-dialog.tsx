"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog"
import { Button } from "@repo/ui/button"
import { Copy } from "lucide-react"
import { DirectoryPicker } from "@/components/file-manager/directory-picker"
import { FileConflictDialog } from "@/components/file-manager/file-conflict-dialog"
import type { FileConflictInfo, FileConflictResolution } from "@/components/file-manager/file-conflict-dialog"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface CopyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DirectoryListingItem | null
  onSuccess?: () => void
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
  const [conflict, setConflict] = React.useState<FileConflictInfo | null>(null)
  const [conflictResolver, setConflictResolver] = React.useState<((resolution: FileConflictResolution | null) => void) | null>(null)

  React.useEffect(() => {
    if (!open) {
      setTargetPath("/")
      setError(null)
      setConflict(null)
      setConflictResolver(null)
    }
  }, [open])

  const waitForConflictResolution = (conflictInfo: FileConflictInfo): Promise<FileConflictResolution | null> => {
    return new Promise((resolve) => {
      setConflict(conflictInfo)
      setConflictResolver(() => resolve)
    })
  }

  const handleConflictResolve = (resolution: FileConflictResolution | null) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPath }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data.code === "FILE_EXISTS") {
          const resolution = await waitForConflictResolution({
            existingFile: data.existingFile,
          })

          if (resolution === "replace") {
            const retryResponse = await fetch(`/api/files/${file.id}/copy`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetPath, overwrite: true }),
            })
            const retryData = await retryResponse.json()
            if (!retryResponse.ok) {
              throw new Error(retryData.error || "Failed to copy")
            }
          } else if (resolution === "rename") {
            const retryResponse = await fetch(`/api/files/${file.id}/copy`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetPath, rename: true }),
            })
            const retryData = await retryResponse.json()
            if (!retryResponse.ok) {
              throw new Error(retryData.error || "Failed to copy")
            }
          } else {
            setLoading(false)
            return
          }
        } else {
          throw new Error(data.error || "Failed to copy")
        }
      }

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

      <FileConflictDialog
        conflict={conflict}
        fileName={file.display_name || file.file_name}
        action="copy"
        onResolve={handleConflictResolve}
      />
    </>
  )
}
