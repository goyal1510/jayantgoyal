"use client"

import { FileThumbnail } from "@/components/file-manager/file-thumbnail"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Card } from "@repo/ui/card"
import { MoreVertical, Star } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { formatFileSize } from "@/lib/file-manager/format-utils"
import type { DirectoryListingItem } from "@/lib/file-manager/types"
import { FileItemDropdownContent, FileItemContextContent } from "@/components/file-manager/file-item-actions"

interface FileGridViewProps {
  files: DirectoryListingItem[]
  viewMode: "grid" | "list"
  selectedIds: Set<string>
  onItemClick: (file: DirectoryListingItem) => void
  onSelectionToggle: (fileId: string, checked?: boolean) => void
  onDownload: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onRename: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onDelete: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onMove: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onCopy: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onShare: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onRestore?: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onPermanentDelete?: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onToggleStar?: (e: React.MouseEvent, file: DirectoryListingItem) => void
  trashMode?: boolean
}

export function FileGridView({
  files,
  viewMode,
  selectedIds,
  onItemClick,
  onSelectionToggle,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onShare,
  onRestore,
  onPermanentDelete,
  onToggleStar,
  trashMode = false,
}: FileGridViewProps) {
  const handlers = {
    onView: onItemClick,
    onDownload,
    onRename,
    onMove,
    onCopy,
    onShare,
    onDelete,
    onRestore,
    onPermanentDelete,
    onToggleStar,
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
        viewMode === "list" ? "sm:hidden" : ""
      )}
    >
      {files.map((file) => {
        const displayName = file.display_name || file.file_name
        const isDirectory = file.is_directory
        const isSelected = selectedIds.has(file.id)
        return (
          <ContextMenu key={file.id}>
            <ContextMenuTrigger asChild>
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-colors hover:bg-accent relative group",
                  isDirectory && "hover:bg-accent/80",
                  isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
                onClick={() => onItemClick(file)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) =>
                    onSelectionToggle(file.id, event.target.checked)
                  }
                  onClick={(event) => event.stopPropagation()}
                  className={cn(
                    "absolute left-2 top-2 h-4 w-4 cursor-pointer accent-primary",
                    isSelected
                      ? "opacity-100"
                      : "opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  )}
                  aria-label={`Select ${displayName}`}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Actions for ${displayName}`}
                      title={`Actions for ${displayName}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <FileItemDropdownContent file={file} handlers={handlers} trashMode={trashMode} />
                </DropdownMenu>
                <div className="flex flex-col items-center gap-2">
                  <FileThumbnail
                    file={file}
                    size={48}
                  />
                  <div className="text-center w-full">
                    <p className="text-sm font-medium truncate" title={displayName}>
                      {displayName}
                    </p>
                    {file.is_starred && !trashMode && (
                      <div className="mt-1 flex justify-center text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </div>
                    )}
                    {!isDirectory && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size_bytes || 0)}
                      </p>
                    )}
                    {isDirectory && file.child_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {file.child_count} item{file.child_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </ContextMenuTrigger>
            <FileItemContextContent file={file} handlers={handlers} trashMode={trashMode} />
          </ContextMenu>
        )
      })}
    </div>
  )
}
