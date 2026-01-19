"use client"

import * as React from "react"
import { FileFolderIcon } from "@/components/file-icons"
import { Button } from "@/components/ui/button"
import { Spinner, SpinnerWithText } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card } from "@/components/ui/card"
import { Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DirectoryListingItem } from "@/lib/types"

type SortField = "name" | "date" | "size" | "type"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

interface FileListProps {
  initialPath?: string
}

export function FileList({ initialPath = "/" }: FileListProps) {
  const [files, setFiles] = React.useState<DirectoryListingItem[]>([])
  const [currentPath, setCurrentPath] = React.useState(initialPath)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [sortField, setSortField] = React.useState<SortField>("name")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")

  // Fetch files from API
  const fetchFiles = React.useCallback(async (path: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        path,
        sort: sortField,
        order: sortOrder,
      })

      const response = await fetch(`/api/files?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch files")
      }

      setFiles(data.files || [])
      setCurrentPath(data.directoryPath || path)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [sortField, sortOrder])

  // Fetch files when path, sort field, or sort order changes
  React.useEffect(() => {
    fetchFiles(currentPath)
  }, [currentPath, sortField, sortOrder, fetchFiles])

  // Handle directory navigation
  const handleDirectoryClick = (file: DirectoryListingItem) => {
    if (file.is_directory) {
      setCurrentPath(file.file_path)
    }
  }

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path)
  }

  // Parse path into breadcrumb segments
  const getBreadcrumbSegments = (path: string) => {
    if (path === "/") {
      return [{ name: "Home", path: "/" }]
    }

    const segments = path.split("/").filter(Boolean)
    const breadcrumbs = [{ name: "Home", path: "/" }]

    let currentPath = ""
    for (const segment of segments) {
      currentPath += `/${segment}`
      breadcrumbs.push({
        name: segment,
        path: currentPath + (segment.includes(".") ? "" : "/"),
      })
    }

    return breadcrumbs
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get sort icon
  const getSortIcon = () => {
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerWithText text="Loading files..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Error loading files</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => fetchFiles(currentPath)} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            {getBreadcrumbSegments(currentPath).map((segment, index, array) => {
              const isLast = index === array.length - 1
              return (
                <React.Fragment key={segment.path}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{segment.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => handleBreadcrumbClick(segment.path)}
                        className="cursor-pointer"
                      >
                        {segment.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort: {sortField}
                {getSortIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSortField("name")
                  if (sortField === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  } else {
                    setSortOrder("asc")
                  }
                }}
              >
                Name {sortField === "name" && getSortIcon()}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortField("date")
                  if (sortField === "date") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  } else {
                    setSortOrder("asc")
                  }
                }}
              >
                Date {sortField === "date" && getSortIcon()}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortField("size")
                  if (sortField === "size") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  } else {
                    setSortOrder("asc")
                  }
                }}
              >
                Size {sortField === "size" && getSortIcon()}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortField("type")
                  if (sortField === "type") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  } else {
                    setSortOrder("asc")
                  }
                }}
              >
                Type {sortField === "type" && getSortIcon()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">This folder is empty</p>
            <p className="text-sm text-muted-foreground">
              Upload files or create folders to get started
            </p>
          </div>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              : "space-y-1"
          )}
        >
          {files.map((file) => {
            const displayName = file.display_name || file.file_name
            const isDirectory = file.is_directory

            if (viewMode === "grid") {
              return (
                <Card
                  key={file.id}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-accent",
                    isDirectory && "hover:bg-accent/80"
                  )}
                  onClick={() => handleDirectoryClick(file)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileFolderIcon
                      isFolder={isDirectory}
                      name={file.file_name}
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
              )
            } else {
              return (
                <Card
                  key={file.id}
                  className={cn(
                    "p-3 cursor-pointer transition-colors hover:bg-accent",
                    isDirectory && "hover:bg-accent/80"
                  )}
                  onClick={() => handleDirectoryClick(file)}
                >
                  <div className="flex items-center gap-3">
                    <FileFolderIcon
                      isFolder={isDirectory}
                      name={file.file_name}
                      size={24}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={displayName}>
                        {displayName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {!isDirectory && (
                          <>
                            <span>{formatFileSize(file.size_bytes || 0)}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatDate(file.updated_at)}</span>
                        {isDirectory && file.child_count > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {file.child_count} item{file.child_count !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            }
          })}
        </div>
      )}

      {/* Loading overlay for refresh */}
      {loading && files.length > 0 && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <SpinnerWithText text="Refreshing..." size="lg" />
        </div>
      )}
    </div>
  )
}