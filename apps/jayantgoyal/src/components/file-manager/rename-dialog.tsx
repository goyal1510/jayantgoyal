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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DirectoryListingItem | null
  onSuccess?: () => void
}

export function RenameDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: RenameDialogProps) {
  const [name, setName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Update name when file changes
  React.useEffect(() => {
    if (file) {
      // For files, remove extension from display name
      const displayName = file.display_name || file.file_name
      if (file.is_directory) {
        setName(displayName)
      } else {
        // Remove extension for files
        const lastDotIndex = displayName.lastIndexOf(".")
        setName(lastDotIndex > 0 ? displayName.substring(0, lastDotIndex) : displayName)
      }
      setError(null)
    }
  }, [file])

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setName("")
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to rename")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Rename {file.is_directory ? "Folder" : "File"}
          </DialogTitle>
          <DialogDescription>
            Enter a new name for {file.display_name || file.file_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input">
                {file.is_directory ? "Folder" : "File"} Name
              </Label>
              <Input
                id="rename-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
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
            <Button type="submit" disabled={loading || !name.trim()} className="w-full sm:w-auto">
              {loading ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
