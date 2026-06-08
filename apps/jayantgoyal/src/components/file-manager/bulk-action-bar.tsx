"use client"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  Copy,
  Download,
  FolderInput,
  Trash2,
  X,
} from "lucide-react"

interface BulkActionBarProps {
  selectedCount: number
  selectedFileCount: number
  selectedFolderCount: number
  allSelected: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkDownload: () => void
  onBulkMove: () => void
  onBulkCopy: () => void
  onBulkDelete: () => void
}

export function BulkActionBar({
  selectedCount,
  selectedFileCount,
  selectedFolderCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onBulkDownload,
  onBulkMove,
  onBulkCopy,
  onBulkDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="secondary" className="shrink-0">
          {selectedCount} selected
        </Badge>
        <span className="text-sm text-muted-foreground">
          {selectedFileCount} file{selectedFileCount === 1 ? "" : "s"}
          {selectedFolderCount > 0
            ? `, ${selectedFolderCount} folder${selectedFolderCount === 1 ? "" : "s"}`
            : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={allSelected}
        >
          Select all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBulkDownload}
          disabled={selectedFileCount === 0}
          title="Download selected files"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBulkMove}
          title="Move selected items"
        >
          <FolderInput className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBulkCopy}
          disabled={selectedFileCount === 0 || selectedFolderCount > 0}
          title={
            selectedFolderCount > 0
              ? "Bulk copy supports files only"
              : "Copy selected files"
          }
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={onBulkDelete}
          title="Delete selected items"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
