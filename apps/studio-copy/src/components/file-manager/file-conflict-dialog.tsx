"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog"
import { Button } from "@repo/ui/button"
import { AlertCircle, Replace, SkipForward, Copy } from "lucide-react"
import { formatFileSize } from "@/lib/file-manager/format-utils"

export interface FileConflictInfo {
  existingFile: {
    id: string
    name: string
    fileName: string
    path: string
    size: number
    updated_at: string
    is_directory?: boolean
  }
}

export type FileConflictResolution = "replace" | "skip" | "rename"

interface FileConflictDialogProps {
  conflict: FileConflictInfo | null
  fileName: string
  action: "move" | "copy"
  onResolve: (resolution: FileConflictResolution | null) => void
}

export function FileConflictDialog({
  conflict,
  fileName,
  action,
  onResolve,
}: FileConflictDialogProps) {
  if (!conflict) return null

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const isDirectory = conflict.existingFile.is_directory
  const entityType = isDirectory ? "folder" : "file"

  return (
    <Dialog open={!!conflict} onOpenChange={() => onResolve(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            File Already Exists
          </DialogTitle>
          <DialogDescription>
            A {entityType} named <span className="font-medium">{fileName}</span> already exists at the destination.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">Existing {entityType}: <span className="font-normal">{conflict.existingFile.fileName}</span></p>
            <p className="text-xs text-muted-foreground">
              Path: {conflict.existingFile.path}
            </p>
            <p className="text-xs text-muted-foreground">
              {!isDirectory && `Size: ${formatFileSize(conflict.existingFile.size)} • `}
              Modified: {formatDate(conflict.existingFile.updated_at)}
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
            Cancel {action}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onResolve("rename")}
          >
            <Copy className="h-4 w-4" />
            Keep Both (Rename {action === "move" ? "moved" : "copied"} file)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
