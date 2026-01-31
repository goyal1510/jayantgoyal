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
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { FolderPlus } from "lucide-react"

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentPath: string
  onSuccess?: () => void
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentPath,
  onSuccess,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFolderName("")
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/files/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          parentPath,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create folder")
      }

      // Success
      onOpenChange(false)
      setFolderName("")
      if (onSuccess) {
        onSuccess()
      }
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
            <FolderPlus className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder in {parentPath === "/" ? "root" : parentPath}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                disabled={loading}
                autoFocus
                required
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
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
            <Button type="submit" disabled={loading || !folderName.trim()} className="w-full sm:w-auto">
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
