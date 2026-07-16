"use client"

import * as React from "react"
import { ChevronRight, Folder, FolderOpen, Home } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { DirectoryTreeItem } from "@/lib/file-manager/types"

interface DirectoryPickerProps {
  value: string
  onChange: (path: string) => void
  excludePath?: string // Path to exclude (for move operations - can't move into itself)
  disabled?: boolean
}

interface DirectoryNode {
  id: string
  path: string
  name: string
  displayName: string | null
  childCount: number
  children?: DirectoryNode[]
  isLoading?: boolean
  isExpanded?: boolean
}

export function DirectoryPicker({
  value,
  onChange,
  excludePath,
  disabled = false,
}: DirectoryPickerProps) {
  const [directories, setDirectories] = React.useState<DirectoryNode[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set(["/"]));
  const [loadingPaths, setLoadingPaths] = React.useState<Set<string>>(new Set())

  // Fetch directories for a given path
  const fetchDirectories = React.useCallback(async (parentPath: string) => {
    try {
      if (parentPath === "/") {
        setLoading(true)
      } else {
        setLoadingPaths(prev => new Set(prev).add(parentPath))
      }

      const params = new URLSearchParams({
        path: parentPath,
        sort: "name",
        order: "asc",
      })

      const response = await fetch(`/api/files?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch directories")
      }

      // Filter to only directories
      const dirs = (data.files || [])
        .filter((f: DirectoryTreeItem) => f.is_directory)
        .map((f: DirectoryTreeItem) => ({
          id: f.id,
          path: f.file_path,
          name: f.file_name,
          displayName: f.display_name,
          childCount: f.child_count,
          children: undefined,
          isLoading: false,
          isExpanded: false,
        }))

      if (parentPath === "/") {
        setDirectories(dirs)
      } else {
        // Update children for the expanded directory
        setDirectories(prev => updateDirectoryChildren(prev, parentPath, dirs))
      }
    } catch (error) {
      console.error("Error fetching directories:", error)
    } finally {
      if (parentPath === "/") {
        setLoading(false)
      } else {
        setLoadingPaths(prev => {
          const next = new Set(prev)
          next.delete(parentPath)
          return next
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch root directories on mount
  React.useEffect(() => {
    fetchDirectories("/")
  }, [fetchDirectories])

  // Recursively update children for a directory
  const updateDirectoryChildren = (
    dirs: DirectoryNode[],
    parentPath: string,
    children: DirectoryNode[]
  ): DirectoryNode[] => {
    return dirs.map(dir => {
      if (dir.path === parentPath) {
        return { ...dir, children, isLoading: false }
      }
      if (dir.children) {
        return {
          ...dir,
          children: updateDirectoryChildren(dir.children, parentPath, children),
        }
      }
      return dir
    })
  }

  // Handle expanding/collapsing a directory
  const handleToggleExpand = async (dir: DirectoryNode) => {
    if (disabled) return

    const isCurrentlyExpanded = expandedPaths.has(dir.path)

    if (isCurrentlyExpanded) {
      // Collapse
      setExpandedPaths(prev => {
        const next = new Set(prev)
        next.delete(dir.path)
        return next
      })
    } else {
      // Expand and fetch children if not already loaded
      setExpandedPaths(prev => new Set(prev).add(dir.path))
      if (!dir.children) {
        await fetchDirectories(dir.path)
      }
    }
  }

  // Handle selecting a directory
  const handleSelect = (path: string) => {
    if (disabled) return
    // Check if this path is excluded
    if (excludePath && (path === excludePath || path.startsWith(excludePath))) {
      return
    }
    onChange(path)
  }

  // Check if a path should be disabled (excluded)
  const isPathDisabled = (path: string): boolean => {
    if (!excludePath) return false
    return path === excludePath || path.startsWith(excludePath)
  }

  // Render a single directory node
  const renderDirectory = (dir: DirectoryNode, depth: number = 0) => {
    const isExpanded = expandedPaths.has(dir.path)
    const isSelected = value === dir.path
    const isLoading = loadingPaths.has(dir.path)
    const isDisabled = isPathDisabled(dir.path)

    return (
      <div key={dir.id}>
        <div
          className={cn(
            "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
            isSelected && !isDisabled && "bg-primary text-primary-foreground",
            !isSelected && !isDisabled && "hover:bg-accent",
            isDisabled && "opacity-50 cursor-not-allowed",
            disabled && "pointer-events-none opacity-50"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => !isDisabled && handleSelect(dir.path)}
        >
          {/* Expand/Collapse button */}
          <button
            type="button"
            className={cn(
              "h-5 w-5 p-0 shrink-0 cursor-pointer rounded hover:bg-accent/50 flex items-center justify-center",
              isSelected && "hover:bg-primary-foreground/20",
              disabled && "pointer-events-none opacity-50"
            )}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleToggleExpand(dir)
            }}
            disabled={disabled}
          >
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </button>

          {/* Folder icon */}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 shrink-0" />
          )}

          {/* Directory name */}
          <span className="text-sm truncate">
            {dir.displayName || dir.name}
          </span>

          {/* Child count badge */}
          {dir.childCount > 0 && (
            <span className={cn(
              "ml-auto text-xs px-1.5 py-0.5 rounded-full shrink-0",
              isSelected ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              {dir.childCount}
            </span>
          )}
        </div>

        {/* Children */}
        {isExpanded && dir.children && (
          <div>
            {dir.children.map(child => renderDirectory(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <ScrollArea className="h-[300px]">
        <div className="p-2">
          {/* Root directory option */}
          <div
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
              value === "/" && "bg-primary text-primary-foreground",
              value !== "/" && "hover:bg-accent",
              disabled && "pointer-events-none opacity-50"
            )}
            onClick={() => handleSelect("/")}
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Home (Root)</span>
          </div>

          {/* Directory tree */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : directories.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No folders found
            </div>
          ) : (
            <div className="mt-1">
              {directories.map(dir => renderDirectory(dir))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
