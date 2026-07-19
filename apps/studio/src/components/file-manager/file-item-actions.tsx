"use client"

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@repo/ui/dropdown-menu"
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@repo/ui/context-menu"
import { Eye, Download, Pencil, FolderInput, Copy, Trash2 } from "lucide-react"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

interface FileActionHandlers {
  onView: (file: DirectoryListingItem) => void
  onDownload: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onRename: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onMove: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onCopy: (e: React.MouseEvent, file: DirectoryListingItem) => void
  onDelete: (e: React.MouseEvent, file: DirectoryListingItem) => void
}

interface FileItemDropdownProps {
  file: DirectoryListingItem
  handlers: FileActionHandlers
}

export function FileItemDropdownContent({ file, handlers }: FileItemDropdownProps) {
  const isDirectory = file.is_directory
  return (
    <DropdownMenuContent align="end">
      {!isDirectory && (
        <>
          <DropdownMenuItem onClick={() => handlers.onView(file)}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e: React.MouseEvent) => handlers.onDownload(e, file)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem onClick={(e: React.MouseEvent) => handlers.onRename(e, file)}>
        <Pencil className="h-4 w-4 mr-2" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e: React.MouseEvent) => handlers.onMove(e, file)}>
        <FolderInput className="h-4 w-4 mr-2" />
        Move to...
      </DropdownMenuItem>
      {!isDirectory && (
        <DropdownMenuItem onClick={(e: React.MouseEvent) => handlers.onCopy(e, file)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy to...
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={(e: React.MouseEvent) => handlers.onDelete(e, file)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

interface FileItemContextProps {
  file: DirectoryListingItem
  handlers: FileActionHandlers
}

export function FileItemContextContent({ file, handlers }: FileItemContextProps) {
  const isDirectory = file.is_directory
  return (
    <ContextMenuContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
      {!isDirectory && (
        <>
          <ContextMenuItem onClick={() => handlers.onView(file)}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </ContextMenuItem>
          <ContextMenuItem onClick={(e: React.MouseEvent) => handlers.onDownload(e, file)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      <ContextMenuItem onClick={(e: React.MouseEvent) => handlers.onRename(e, file)}>
        <Pencil className="h-4 w-4 mr-2" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem onClick={(e: React.MouseEvent) => handlers.onMove(e, file)}>
        <FolderInput className="h-4 w-4 mr-2" />
        Move to...
      </ContextMenuItem>
      {!isDirectory && (
        <ContextMenuItem onClick={(e: React.MouseEvent) => handlers.onCopy(e, file)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy to...
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={(e: React.MouseEvent) => handlers.onDelete(e, file)}
        variant="destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
