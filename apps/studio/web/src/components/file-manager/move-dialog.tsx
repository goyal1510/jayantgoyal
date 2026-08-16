"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayant/web-ui/dialog"
import { Button } from "@jayant/web-ui/button"
import { FolderInput } from "lucide-react"
import { DirectoryPicker } from "@/components/file-manager/directory-picker"
import { FileConflictDialog } from "@/components/file-manager/file-conflict-dialog"
import type { FileConflictInfo, FileConflictResolution } from "@/components/file-manager/file-conflict-dialog"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface MoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DirectoryListingItem | null
  onSuccess?: () => void
}

export function MoveDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: MoveDialogProps) {
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

  const getCurrentParentPath = (): string => {
    if (!file) return "/"
    const path = file.file_path
    const fileName = file.file_name
    const parentPath = path.substring(0, path.lastIndexOf(fileName))
    return parentPath || "/"
  }

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

    const currentParent = getCurrentParentPath()
    if (targetPath === currentParent) {
      setError("File is already in this location")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/files/${file.id}/move`, {
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
            const retryResponse = await fetch(`/api/files/${file.id}/move`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetPath, overwrite: true }),
            })
            const retryData = await retryResponse.json()
            if (!retryResponse.ok) {
              throw new Error(retryData.error || "Failed to move")
            }
          } else if (resolution === "rename") {
            const retryResponse = await fetch(`/api/files/${file.id}/move`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetPath, rename: true }),
            })
            const retryData = await retryResponse.json()
            if (!retryResponse.ok) {
              throw new Error(retryData.error || "Failed to move")
            }
          } else {
            setLoading(false)
            return
          }
        } else {
          throw new Error(data.error || "Failed to move")
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

  const excludePath = file.is_directory ? file.file_path : undefined

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="h-5 w-5" />
              Move {file.is_directory ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Select a destination folder for &quot;{file.display_name || file.file_name}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <DirectoryPicker
                  value={targetPath}
                  onChange={setTargetPath}
                  excludePath={excludePath}
                  disabled={loading}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                {targetPath && (
                  <p className="text-sm text-muted-foreground">
                    Moving to: <span className="font-mono">{targetPath}</span>
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
                disabled={loading || targetPath === getCurrentParentPath()}
                className="w-full sm:w-auto"
              >
                {loading ? "Moving..." : "Move"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FileConflictDialog
        conflict={conflict}
        fileName={file.display_name || file.file_name}
        action="move"
        onResolve={handleConflictResolve}
      />
    </>
  )
}
