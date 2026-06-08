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
import { AlertTriangle, Trash2 } from "lucide-react"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface BulkDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: DirectoryListingItem[]
  onSuccess?: () => void
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  files,
  onSuccess,
}: BulkDeleteDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) setError(null)
  }, [open])

  const handleDelete = async () => {
    if (files.length === 0) return

    setError(null)
    setLoading(true)

    try {
      const failures: string[] = []

      for (const file of files) {
        const response = await fetch(`/api/files/${file.id}`, {
          method: "DELETE",
        })
        const data = await response.json()

        if (!response.ok) {
          failures.push(
            `${file.display_name || file.file_name}: ${data.error || "Delete failed"}`
          )
        }
      }

      if (failures.length > 0) {
        throw new Error(failures.slice(0, 3).join("; "))
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Selected Items
          </DialogTitle>
          <DialogDescription>
            Delete {files.length} selected item{files.length === 1 ? "" : "s"}.
            Items will be moved to trash.
          </DialogDescription>
        </DialogHeader>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
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
            disabled={loading || files.length === 0}
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
