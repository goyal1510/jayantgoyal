"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { FileFolderIcon } from "@/components/file-icons"
import { Button } from "@/components/ui/button"
import { SpinnerWithText } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card } from "@/components/ui/card"
import { Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, FolderPlus, Upload, Pencil, Trash2, Plus, Ellipsis, MoreVertical, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DirectoryListingItem } from "@/lib/types"
import { CreateFolderDialog } from "@/components/create-folder-dialog"
import { RenameDialog } from "@/components/rename-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { UploadDialog } from "@/components/upload-dialog"
import { FileViewer } from "@/components/file-viewer"

type SortField = "name" | "date" | "size" | "type"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

interface FileListProps {
  initialPath?: string
}

export function FileList({ initialPath = "/" }: FileListProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [files, setFiles] = React.useState<DirectoryListingItem[]>([])
  
  // Initialize currentPath from pathname (Next.js usePathname() returns decoded pathname)
  // Extract path directly from pathname on initial mount
  const [currentPath, setCurrentPath] = React.useState(() => {
    if (pathname.startsWith("/files")) {
      const pathPart = pathname.replace(/^\/files\/?/, "").trim()
      if (pathPart) {
        // pathname from Next.js is already decoded, so use it directly
        const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`
        return path.endsWith("/") ? path : `${path}/`
      }
    }
    return "/"
  })
  const [lastValidPath, setLastValidPath] = React.useState(currentPath)
  const [sortField, setSortField] = React.useState<SortField>("name")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fileManagerViewMode")
      if (saved === "grid" || saved === "list") {
        return saved
      }
    }
    return "grid"
  })
  const [loading, setLoading] = React.useState(true)
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)

  // Persist view mode to localStorage
  React.useEffect(() => {
    localStorage.setItem("fileManagerViewMode", viewMode)
  }, [viewMode])
  
  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [fileViewerOpen, setFileViewerOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<DirectoryListingItem | null>(null)
  
  // Track minimum loading time to prevent flickering
  const loadingStartTime = React.useRef<number | null>(null)
  const MIN_LOADING_TIME = 800 // Minimum 800ms loading time for smoother transitions
  
  // Track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = React.useRef<boolean>(false)
  const pendingPathRef = React.useRef<string | null>(null)

  // Convert path to URL segments (normalize: ensure no trailing slash for URL)
  const pathToUrl = React.useCallback((path: string): string => {
    if (path === "/" || path === "") return "/files"
    // Remove leading/trailing slashes and split
    const cleanPath = path.replace(/^\/+|\/+$/g, "")
    if (!cleanPath) return "/files"
    // Split and join - Next.js will handle encoding automatically
    const segments = cleanPath.split("/").filter(Boolean)
    return `/files/${segments.join("/")}`
  }, [])

  // Convert URL to path (normalize: ensure trailing slash for directory paths)
  // Next.js usePathname() returns decoded pathname, so we can use it directly
  const urlToPath = React.useCallback((url: string): string => {
    if (url === "/files" || url === "/files/") return "/"
    
    // Remove "/files" prefix - pathname from Next.js is already decoded
    let pathPart = url.replace(/^\/files\/?/, "").trim()
    
    if (!pathPart) return "/"
    
    // Next.js usePathname() already decodes, but handle edge cases
    // If pathPart contains encoded characters (shouldn't happen with usePathname, but be safe)
    try {
      // Only decode if it looks encoded (contains %)
      if (pathPart.includes("%")) {
        pathPart = decodeURIComponent(pathPart)
      }
    } catch {
      // If decoding fails, use as-is
    }
    
    // Ensure it starts with / and ends with / (for directories)
    const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`
    return path.endsWith("/") ? path : `${path}/`
  }, [])

  // Navigate to a path
  const navigateToPath = React.useCallback((path: string) => {
    // Normalize path: ensure it ends with / for directories
    const normalizedPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`
    // Update URL first, then state will sync from pathname change
    const url = pathToUrl(normalizedPath)
    router.push(url)
    // Don't set currentPath here - let the useEffect sync from pathname
  }, [router, pathToUrl])

  // Sync currentPath with URL - use pathname as single source of truth
  // Next.js usePathname() returns decoded pathname, so we can trust it
  React.useEffect(() => {
    if (pathname.startsWith("/files")) {
      const urlPath = urlToPath(pathname)
      // Always update to ensure we're in sync with URL
      setCurrentPath(urlPath)
      setLastValidPath(urlPath)
    } else {
      // If not on /files route, default to root
      setCurrentPath("/")
      setLastValidPath("/")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Only depend on pathname

  // Fetch files from API
  const fetchFiles = React.useCallback(async (path: string) => {
    // Normalize path for comparison
    const normalizedPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`
    
    // If we're already fetching, queue this path or skip if it's the same
    if (isFetchingRef.current) {
      // If it's a different path, queue it
      if (pendingPathRef.current !== normalizedPath) {
        pendingPathRef.current = normalizedPath
      }
      return
    }
    
    // Mark as fetching
    isFetchingRef.current = true
    pendingPathRef.current = null
    
    // Start loading timer
    loadingStartTime.current = Date.now()
    setLoading(true)
    
    try {
      // Normalize path: ensure it ends with / for directories
      const normalizedPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`
      
      // Ensure path is properly decoded before passing to URLSearchParams
      // URLSearchParams will encode it, so we need to make sure it's not already encoded
      let decodedPath = normalizedPath
      try {
        // If path contains encoded characters, decode them first
        decodedPath = decodeURIComponent(normalizedPath)
      } catch {
        // If decoding fails, use path as-is
        decodedPath = normalizedPath
      }
      
      const params = new URLSearchParams({
        path: decodedPath,
        sort: sortField,
        order: sortOrder,
      })

      const response = await fetch(`/api/files?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          toast.error(data.error || "Directory not found")
          if (lastValidPath !== normalizedPath) {
            navigateToPath(lastValidPath)
            return
          }
        }
        throw new Error(data.error || "Failed to fetch files")
      }

      // Calculate elapsed time and ensure minimum loading time
      const elapsed = Date.now() - (loadingStartTime.current || 0)
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)
      
      // Wait for minimum loading time to prevent flickering
      await new Promise(resolve => setTimeout(resolve, remainingTime))
      
      setFiles(data.files || [])
      setLastValidPath(normalizedPath)
      setIsInitialLoad(false)
    } catch (err) {
      // Calculate elapsed time and ensure minimum loading time even on error
      const elapsed = Date.now() - (loadingStartTime.current || 0)
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)
      await new Promise(resolve => setTimeout(resolve, remainingTime))
      
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      toast.error(errorMessage)
      if (lastValidPath !== normalizedPath && normalizedPath !== "/") {
        navigateToPath(lastValidPath)
      } else {
        // Only clear files if we're staying on this path
        setFiles([])
      }
    } finally {
      setLoading(false)
      loadingStartTime.current = null
      isFetchingRef.current = false
      
      // If there's a pending path, fetch it now
      if (pendingPathRef.current) {
        const nextPath = pendingPathRef.current
        pendingPathRef.current = null
        // Use setTimeout to avoid calling during render
        setTimeout(() => fetchFiles(nextPath), 0)
      }
    }
  }, [sortField, sortOrder, lastValidPath, navigateToPath])

  // Fetch files when path or sort changes
  React.useEffect(() => {
    // Only fetch if we're not already fetching and path has actually changed
    if (!isFetchingRef.current && currentPath) {
      fetchFiles(currentPath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, sortField, sortOrder]) // Don't include fetchFiles to avoid recreating effect

  // Handle file/directory click
  const handleItemClick = (file: DirectoryListingItem) => {
    if (file.is_directory) {
      // Navigate into the folder
      const folderPath = file.file_path.endsWith("/") ? file.file_path : `${file.file_path}/`
      navigateToPath(folderPath)
    } else {
      // Open file viewer for files
      setSelectedFile(file)
      setFileViewerOpen(true)
    }
  }

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (path: string) => {
    navigateToPath(path)
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
        path: currentPath + "/",
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

  // Handle refresh after operations
  const handleRefresh = React.useCallback(() => {
    fetchFiles(currentPath)
  }, [currentPath, fetchFiles])

  // Handle context menu actions
  const handleRename = (file: DirectoryListingItem) => {
    setSelectedFile(file)
    setRenameDialogOpen(true)
  }

  const handleDelete = (file: DirectoryListingItem) => {
    setSelectedFile(file)
    setDeleteDialogOpen(true)
  }

  // Prevent navigation when clicking context menu
  const handleContextMenuClick = (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar - Always visible */}
      <div className="flex items-center justify-between gap-2">
        {/* Breadcrumb Navigation - Collapsible */}
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList>
            {(() => {
              const segments = getBreadcrumbSegments(currentPath)
              const currentSegment = segments[segments.length - 1]
              const parentSegments = segments.slice(0, -1)

              // If we have parent segments, show collapsed view with dropdown
              if (parentSegments.length > 0) {
                return (
                  <>
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-auto p-1 gap-1">
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {parentSegments.map((segment) => (
                            <DropdownMenuItem
                              key={segment.path}
                              onClick={() => handleBreadcrumbClick(segment.path)}
                              className="cursor-pointer"
                            >
                              {segment.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="truncate max-w-[200px]">
                        {currentSegment?.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )
              }

              // Root level - just show Home
              return (
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentSegment?.name}</BreadcrumbPage>
                </BreadcrumbItem>
              )
            })()}
          </BreadcrumbList>
        </Breadcrumb>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* New Button - Combined Upload & New Folder */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setUploadDialogOpen(true)} className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateFolderOpen(true)} className="cursor-pointer">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Sort: {sortField}</span>
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

          {/* View Mode Toggle - Hidden on mobile, grid is default */}
          <div className="hidden sm:flex items-center border rounded-md">
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

      {/* File List Content */}
      {loading && files.length === 0 ? (
        // Show spinner only when loading and no files to show
        // Match the grid layout size to prevent size jumps
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              : "space-y-1"
          )}
        >
          <Card className="p-12 col-span-full">
            <div className="flex items-center justify-center min-h-[300px]">
              <SpinnerWithText text="Loading files..." size="lg" />
            </div>
          </Card>
        </div>
      ) : files.length === 0 ? (
        // Show empty state when not loading and no files
        <Card className="p-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">This folder is empty</p>
            <p className="text-sm text-muted-foreground">
              Upload files or create folders to get started
            </p>
          </div>
        </Card>
      ) : (
        // Show files (with optional loading overlay if loading but files exist)
        <div className="relative">
          {loading && files.length > 0 && (
            // Show subtle loading indicator overlay when loading but files are visible
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <SpinnerWithText text="Loading..." size="md" />
            </div>
          )}
          <>
            {/* Grid View - Always shown on mobile, shown on desktop when viewMode is grid */}
            <div
              className={cn(
                "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
                viewMode === "list" ? "sm:hidden" : "" // Hide on desktop when list view is selected
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
                        onClick={() => handleItemClick(file)}
                      >
                        {/* Three-dot menu button */}
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
                          <DropdownMenuContent align="end">
                            {!isDirectory && (
                              <>
                                <DropdownMenuItem onClick={() => handleItemClick(file)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleRename(file)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(file)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                    </ContextMenuTrigger>
                    <ContextMenuContent onClick={(e) => handleContextMenuClick(e, file)}>
                      {!isDirectory && (
                        <>
                          <ContextMenuItem onClick={() => handleItemClick(file)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                        </>
                      )}
                      <ContextMenuItem onClick={() => handleRename(file)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDelete(file)}
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
            </div>

            {/* List/Table View - Only shown on desktop (sm+) when viewMode is list */}
            {viewMode === "list" && (
              <div className="hidden sm:block border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_100px_120px_140px_40px] gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                  <div>Name</div>
                  <div className="text-right">Size</div>
                  <div>Type</div>
                  <div>Modified</div>
                  <div></div>
                </div>
                {/* Table Body */}
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
                            onClick={() => handleItemClick(file)}
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
                              {isDirectory ? "—" : formatFileSize(file.size_bytes || 0)}
                            </div>
                            <div className="text-sm text-muted-foreground capitalize truncate">
                              {fileType}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(file.updated_at)}
                            </div>
                            {/* Three-dot menu */}
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
                                <DropdownMenuContent align="end">
                                  {!isDirectory && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleItemClick(file)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={() => handleRename(file)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(file)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent onClick={(e) => handleContextMenuClick(e, file)}>
                          {!isDirectory && (
                            <>
                              <ContextMenuItem onClick={() => handleItemClick(file)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                            </>
                          )}
                          <ContextMenuItem onClick={() => handleRename(file)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => handleDelete(file)}
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        </div>
      )}

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentPath={currentPath}
        onSuccess={handleRefresh}
      />
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        directoryPath={currentPath}
        onSuccess={handleRefresh}
      />
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        file={selectedFile}
        onSuccess={handleRefresh}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        file={selectedFile}
        onSuccess={handleRefresh}
      />
      <FileViewer
        open={fileViewerOpen}
        onOpenChange={setFileViewerOpen}
        file={selectedFile}
        files={files}
        onFileChange={setSelectedFile}
      />
    </div>
  )
}
