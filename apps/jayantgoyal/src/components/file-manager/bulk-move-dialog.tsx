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
import { FolderInput } from "lucide-react"
import { DirectoryPicker } from "@/components/file-manager/directory-picker"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface BulkMoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: DirectoryListingItem[]
  onSuccess?: () => void
}

export function BulkMoveDialog({
  open,
  onOpenChange,
  files,
  onSuccess,
}: BulkMoveDialogProps) {
  const [targetPath, setTargetPath] = React.useState("/")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setTargetPath("/")
      setError(null)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (files.length === 0) return

    setError(null)
    setLoading(true)

    try {
      const failures: string[] = []

      for (const file of files) {
        const response = await fetch(`/api/files/${file.id}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPath, rename: true }),
        })
        const data = await response.json()

        if (!response.ok) {
          failures.push(
            `${file.display_name || file.file_name}: ${data.error || "Move failed"}`
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="h-5 w-5" />
            Move Selected Items
          </DialogTitle>
          <DialogDescription>
            Move {files.length} selected item{files.length === 1 ? "" : "s"} to
            another folder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <DirectoryPicker
              value={targetPath}
              onChange={setTargetPath}
              disabled={loading}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              Moving to: <span className="font-mono">{targetPath}</span>
            </p>
          </div>
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
              type="submit"
              disabled={loading || files.length === 0}
              className="w-full sm:w-auto"
            >
              {loading ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
