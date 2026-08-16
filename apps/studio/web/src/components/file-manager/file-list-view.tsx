"use client"

import { FileFolderIcon } from "@/components/file-manager/file-icons"
import { Button } from "@jayant/web-ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@jayant/web-ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@jayant/web-ui/context-menu"
import { MoreVertical } from "lucide-react"
import { formatFileSize, formatDate } from "@/lib/file-manager/format-utils"
import type { DirectoryListingItem } from "@/lib/file-manager/types"
import { FileItemDropdownContent, FileItemContextContent } from "@/components/file-manager/file-item-actions"

interface FileListViewProps {
  files: DirectoryListingItem[]
  onItemClick: (file: DirectoryListingItem) => void
  onDownload: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onRename: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onDelete: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onMove: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onCopy: (e: React.MouseEvent, file: DirectoryListingItem) => void
}

export function FileListView({
  files,
  onItemClick,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
}: FileListViewProps) {
  const handlers = {
    onView: onItemClick,
    onDownload,
    onRename,
    onMove,
    onCopy,
    onDelete,
  }

  return (
    <div className="hidden sm:block border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_120px_140px_40px] gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
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
          return (
            <ContextMenu key={file.id}>
              <ContextMenuTrigger asChild>
                <div
                  className="grid grid-cols-[1fr_100px_120px_140px_40px] gap-4 px-4 py-2 cursor-pointer transition-colors hover:bg-accent items-center group"
                  onClick={() => onItemClick(file)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileFolderIcon
                      isFolder={isDirectory}
                      name={file.file_name}
                      size={20}
                    />
                    <span className="text-sm truncate" title={displayName}>
                      {displayName}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    {isDirectory ? "\u2014" : formatFileSize(file.size_bytes || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize truncate">
                    {fileType}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(file.updated_at)}
                  </div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <FileItemDropdownContent file={file} handlers={handlers} />
                    </DropdownMenu>
                  </div>
                </div>
              </ContextMenuTrigger>
              <FileItemContextContent file={file} handlers={handlers} />
            </ContextMenu>
          )
        })}
      </div>
    </div>
  )
}
