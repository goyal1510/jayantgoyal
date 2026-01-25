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
import { Trash2, AlertTriangle } from "lucide-react"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DirectoryListingItem | null
  onSuccess?: () => void
}

export function DeleteDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: DeleteDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset error when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setError(null)
    }
  }, [open])

  const handleDelete = async () => {
    if (!file) return

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete")
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

  const displayName = file.display_name || file.file_name
  const isDirectory = file.is_directory

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {isDirectory ? "Folder" : "File"}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{displayName}&rdquo;?
            {isDirectory && file.child_count > 0 && (
              <span className="block mt-2 text-destructive">
                This folder contains {file.child_count} item{file.child_count !== 1 ? "s" : ""}.
              </span>
            )}
            <span className="block mt-2">
              This action cannot be undone. The {isDirectory ? "folder" : "file"} will be moved to trash.
            </span>
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
