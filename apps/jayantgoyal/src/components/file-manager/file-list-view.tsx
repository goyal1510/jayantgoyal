"use client"

import { FileFolderIcon } from "@/components/file-manager/file-icons"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { MoreVertical, Star } from "lucide-react"
import { formatFileSize, formatDate } from "@/lib/file-manager/format-utils"
import type { DirectoryListingItem } from "@/lib/file-manager/types"
import { FileItemDropdownContent, FileItemContextContent } from "@/components/file-manager/file-item-actions"
import { cn } from "@repo/ui/lib/utils"

interface FileListViewProps {
  files: DirectoryListingItem[]
  selectedIds: Set<string>
  allVisibleSelected: boolean
  onItemClick: (file: DirectoryListingItem) => void
  onSelectionToggle: (fileId: string, checked?: boolean) => void
  onSelectAll: () => void
  onClearSelection: () => void
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

export function FileListView({
  files,
  selectedIds,
  allVisibleSelected,
  onItemClick,
  onSelectionToggle,
  onSelectAll,
  onClearSelection,
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
}: FileListViewProps) {
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
    <div className="hidden sm:block border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[32px_1fr_100px_120px_140px_40px] gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
        <div>
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(event) => {
              if (event.target.checked) {
                onSelectAll()
              } else {
                onClearSelection()
              }
            }}
            className="h-4 w-4 cursor-pointer accent-primary"
            aria-label="Select all visible items"
          />
        </div>
        <div>Name</div>
        <div className="text-right">Size</div>
        <div>Type</div>
        <div>Modified</div>
        <div></div>
      </div>
      <div className="divide-y">
        {files.map((file) => {
          const displayName = file.display_name || file.file_name
          const isDirectory = file.is_directory
          const fileType = isDirectory
            ? `Folder${file.child_count > 0 ? ` (${file.child_count})` : ""}`
            : file.file_type || "File"
          const isSelected = selectedIds.has(file.id)
          return (
            <ContextMenu key={file.id}>
              <ContextMenuTrigger asChild>
                <div
                  className={cn(
                    "grid grid-cols-[32px_1fr_100px_120px_140px_40px] gap-4 px-4 py-2 cursor-pointer transition-colors hover:bg-accent items-center group",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onItemClick(file)}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) =>
                        onSelectionToggle(file.id, event.target.checked)
                      }
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 cursor-pointer accent-primary"
                      aria-label={`Select ${displayName}`}
                    />
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileFolderIcon
                      isFolder={isDirectory}
                      name={file.file_name}
                      size={20}
                    />
                    <span className="text-sm truncate" title={displayName}>
                      {displayName}
                    </span>
                    {file.is_starred && !trashMode && (
                      <Star className="h-3.5 w-3.5 flex-none fill-amber-500 text-amber-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    {isDirectory ? "\u2014" : formatFileSize(file.size_bytes || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize truncate">
                    {fileType}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(trashMode ? file.deleted_at || file.updated_at : file.updated_at)}
                  </div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Actions for ${displayName}`}
                          title={`Actions for ${displayName}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <FileItemDropdownContent file={file} handlers={handlers} trashMode={trashMode} />
                    </DropdownMenu>
                  </div>
                </div>
              </ContextMenuTrigger>
              <FileItemContextContent file={file} handlers={handlers} trashMode={trashMode} />
            </ContextMenu>
          )
        })}
      </div>
    </div>
  )
}
