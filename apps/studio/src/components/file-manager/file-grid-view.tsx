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
} from "@repo/ui/context-menu"
import { Card } from "@repo/ui/card"
import { MoreVertical } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { formatFileSize } from "@/lib/file-manager/format-utils"
import type { DirectoryListingItem } from "@/lib/file-manager/types"
import { FileItemDropdownContent, FileItemContextContent } from "@/components/file-manager/file-item-actions"

interface FileGridViewProps {
  files: DirectoryListingItem[]
  viewMode: "grid" | "list"
  onItemClick: (file: DirectoryListingItem) => void
  onDownload: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onRename: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onDelete: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onMove: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onCopy: (e: React.MouseEvent, file: DirectoryListingItem) => void
}

export function FileGridView({
  files,
  viewMode,
  onItemClick,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
}: FileGridViewProps) {
  const handlers = {
    onView: onItemClick,
    onDownload,
    onRename,
    onMove,
    onCopy,
    onDelete,
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
        return (
          <ContextMenu key={file.id}>
            <ContextMenuTrigger asChild>
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-colors hover:bg-accent relative group",
                  isDirectory && "hover:bg-accent/80"
                )}
                onClick={() => onItemClick(file)}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <FileItemDropdownContent file={file} handlers={handlers} />
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
            <FileItemContextContent file={file} handlers={handlers} />
          </ContextMenu>
        )
      })}
    </div>
  )
}
