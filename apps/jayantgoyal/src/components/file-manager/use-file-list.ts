"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

type SortField = "name" | "date" | "size" | "type"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
export type FileCollectionMode = "files" | "recent" | "starred" | "trash"

interface StorageUsage {
  usedBytes: number
  fileCount: number
  folderCount: number
  starredCount: number
  recentCount: number
  usageByType: Record<string, number>
}

export function useFileList() {
  const router = useRouter()
  const pathname = usePathname()

  const [files, setFiles] = React.useState<DirectoryListingItem[]>([])

  const [currentPath, setCurrentPath] = React.useState(() => {
    if (pathname.startsWith("/files")) {
      const pathPart = pathname.replace(/^\/files\/?/, "").trim()
      if (pathPart) {
        const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`
        return path.endsWith("/") ? path : `${path}/`
      }
    }
    return "/"
  })
  const [lastValidPath, setLastValidPath] = React.useState(currentPath)
  const [sortField, setSortField] = React.useState<SortField>("name")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("")
  const [collectionMode, setCollectionMode] = React.useState<FileCollectionMode>("files")
  const trashMode = collectionMode === "trash"
  const [storageUsage, setStorageUsage] = React.useState<StorageUsage | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fileManagerViewMode")
      if (saved === "grid" || saved === "list") {
        return saved
      }
    }
    return "list"
  })
  const [loading, setLoading] = React.useState(true)
  const [, setIsInitialLoad] = React.useState(true)

  React.useEffect(() => {
    localStorage.setItem("fileManagerViewMode", viewMode)
  }, [viewMode])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [searchQuery])

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = React.useState(false)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = React.useState(false)
  const [bulkCopyDialogOpen, setBulkCopyDialogOpen] = React.useState(false)
  const [fileViewerOpen, setFileViewerOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<DirectoryListingItem | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  )

  const loadingStartTime = React.useRef<number | null>(null)
  const MIN_LOADING_TIME = 800
  const isFetchingRef = React.useRef<boolean>(false)
  const pendingPathRef = React.useRef<string | null>(null)

  const pathToUrl = React.useCallback((path: string): string => {
    if (path === "/" || path === "") return "/files"
    const cleanPath = path.replace(/^\/+|\/+$/g, "")
    if (!cleanPath) return "/files"
    const segments = cleanPath.split("/").filter(Boolean)
    return `/files/${segments.join("/")}`
  }, [])

  const urlToPath = React.useCallback((url: string): string => {
    if (url === "/files" || url === "/files/") return "/"
    let pathPart = url.replace(/^\/files\/?/, "").trim()
    if (!pathPart) return "/"
    try {
      if (pathPart.includes("%")) {
        pathPart = decodeURIComponent(pathPart)
      }
    } catch {
      // If decoding fails, use as-is
    }
    const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`
    return path.endsWith("/") ? path : `${path}/`
  }, [])

  const navigateToPath = React.useCallback((path: string) => {
    const normalizedPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`
    const url = pathToUrl(normalizedPath)
    router.push(url)
  }, [router, pathToUrl])

  React.useEffect(() => {
    if (pathname.startsWith("/files")) {
      const urlPath = urlToPath(pathname)
      setCurrentPath(urlPath)
      setLastValidPath(urlPath)
    } else {
      setCurrentPath("/")
      setLastValidPath("/")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [currentPath, trashMode])

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(files.map((file) => file.id))
      const next = new Set(
        Array.from(prev).filter((fileId) => visibleIds.has(fileId))
      )

      if (next.size === prev.size) {
        return prev
      }

      return next
    })
  }, [files])

  const selectedFiles = React.useMemo(
    () => files.filter((file) => selectedIds.has(file.id)),
    [files, selectedIds]
  )
  const selectedFileCount = selectedFiles.filter(
    (file) => !file.is_directory
  ).length
  const selectedFolderCount = selectedFiles.length - selectedFileCount
  const allVisibleSelected = files.length > 0 && selectedFiles.length === files.length

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectAllVisible = React.useCallback(() => {
    setSelectedIds(new Set(files.map((file) => file.id)))
  }, [files])

  const toggleFileSelection = React.useCallback(
    (fileId: string, checked?: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        const shouldSelect = checked ?? !next.has(fileId)

        if (shouldSelect) {
          next.add(fileId)
        } else {
          next.delete(fileId)
        }

        return next
      })
    },
    []
  )

  const fetchStorageUsage = React.useCallback(async () => {
    try {
      const response = await fetch("/api/files/usage")
      const data = await response.json()

      if (response.ok) {
        setStorageUsage(data)
      }
    } catch {
      // Storage usage is summary-only and should not block file browsing.
    }
  }, [])

  React.useEffect(() => {
    fetchStorageUsage()
  }, [fetchStorageUsage])

  const fetchFiles = React.useCallback(async (path: string) => {
    const normalizedPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`

    if (isFetchingRef.current) {
      if (pendingPathRef.current !== normalizedPath) {
        pendingPathRef.current = normalizedPath
      }
      return
    }

    isFetchingRef.current = true
    pendingPathRef.current = null
    loadingStartTime.current = Date.now()
    setLoading(true)

    try {
      const normalizedPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`

      let decodedPath = normalizedPath
      try {
        decodedPath = decodeURIComponent(normalizedPath)
      } catch {
        decodedPath = normalizedPath
      }

      const params = new URLSearchParams({
        path: decodedPath,
        sort: sortField,
        order: sortOrder,
      })
      if (debouncedSearchQuery) {
        params.set("q", debouncedSearchQuery)
      }

      const endpoint =
        collectionMode === "trash"
          ? "/api/files/trash"
          : collectionMode === "recent"
            ? "/api/files/recent"
            : collectionMode === "starred"
              ? "/api/files/starred"
              : "/api/files"
      const response = await fetch(`${endpoint}?${params.toString()}`)
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

      const elapsed = Date.now() - (loadingStartTime.current || 0)
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)
      await new Promise(resolve => setTimeout(resolve, remainingTime))

      setFiles(data.files || [])
      fetchStorageUsage()
      if (!trashMode) {
        setLastValidPath(normalizedPath)
      }
      setIsInitialLoad(false)
    } catch (err) {
      const elapsed = Date.now() - (loadingStartTime.current || 0)
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)
      await new Promise(resolve => setTimeout(resolve, remainingTime))

      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      toast.error(errorMessage)
      if (lastValidPath !== normalizedPath && normalizedPath !== "/") {
        navigateToPath(lastValidPath)
      } else {
        setFiles([])
      }
    } finally {
      setLoading(false)
      loadingStartTime.current = null
      isFetchingRef.current = false

      if (pendingPathRef.current) {
        const nextPath = pendingPathRef.current
        pendingPathRef.current = null
        setTimeout(() => fetchFiles(nextPath), 0)
      }
    }
  }, [sortField, sortOrder, debouncedSearchQuery, lastValidPath, navigateToPath, trashMode, collectionMode, fetchStorageUsage])

  React.useEffect(() => {
    if (!isFetchingRef.current && currentPath) {
      fetchFiles(currentPath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, sortField, sortOrder, debouncedSearchQuery, collectionMode])

  const handleItemClick = (file: DirectoryListingItem) => {
    if (trashMode) {
      toggleFileSelection(file.id)
      return
    }

    if (selectedIds.size > 0) {
      toggleFileSelection(file.id)
      return
    }

    if (file.is_directory) {
      const folderPath = file.file_path.endsWith("/") ? file.file_path : `${file.file_path}/`
      setCollectionMode("files")
      navigateToPath(folderPath)
    } else {
      setSelectedFile(file)
      setFileViewerOpen(true)
    }
  }

  const handleRefresh = React.useCallback(() => {
    fetchFiles(currentPath)
  }, [currentPath, fetchFiles])

  const handleRename = (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
    setSelectedFile(file)
    setRenameDialogOpen(true)
  }

  const handleDelete = (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
    setSelectedFile(file)
    setDeleteDialogOpen(true)
  }

  const handleMove = (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
    setSelectedFile(file)
    setMoveDialogOpen(true)
  }

  const handleCopy = (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
    setSelectedFile(file)
    setCopyDialogOpen(true)
  }

  const handleShare = (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
    setSelectedFile(file)
    setShareDialogOpen(true)
  }

  const downloadFile = async (
    file: DirectoryListingItem,
    options: { showToast?: boolean } = {}
  ) => {
    const { showToast = true } = options
    if (file.is_directory) return

    try {
      const response = await fetch(`/api/files/${file.id}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error || "Failed to get download link")
        return
      }

      const fileResponse = await fetch(data.file.url)
      const blob = await fileResponse.blob()

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = data.file.display_name || data.file.original_filename || file.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      if (showToast) {
        toast.success("Download started")
      }
    } catch {
      toast.error("Failed to download file")
    }
  }

  const handleDownload = async (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
    await downloadFile(file)
  }

  const handleBulkDownload = async () => {
    const downloadableFiles = selectedFiles.filter((file) => !file.is_directory)

    if (downloadableFiles.length === 0) {
      toast.error("Select at least one file to download")
      return
    }

    for (const file of downloadableFiles) {
      await downloadFile(file, { showToast: false })
    }

    toast.success(
      `Started ${downloadableFiles.length} download${downloadableFiles.length === 1 ? "" : "s"}`
    )
  }

  const handleRestore = async (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()

    try {
      const response = await fetch(`/api/files/${file.id}/restore`, {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to restore item")
      }

      toast.success(data.message || "Item restored")
      fetchFiles(currentPath)
      fetchStorageUsage()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore item")
    }
  }

  const handlePermanentDelete = async (
    e: React.MouseEvent,
    file: DirectoryListingItem
  ) => {
    e.stopPropagation()

    const displayName = file.display_name || file.file_name
    const confirmed = window.confirm(
      `Permanently delete "${displayName}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/files/${file.id}/permanent`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to permanently delete item")
      }

      toast.success(data.message || "Item permanently deleted")
      clearSelection()
      fetchFiles(currentPath)
      fetchStorageUsage()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to permanently delete item"
      )
    }
  }

  const handleToggleStar = async (
    e: React.MouseEvent,
    file: DirectoryListingItem
  ) => {
    e.stopPropagation()

    const nextStarred = !file.is_starred

    try {
      const response = await fetch(`/api/files/${file.id}/star`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ starred: nextStarred }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update starred state")
      }

      toast.success(nextStarred ? "Added to starred" : "Removed from starred")
      fetchFiles(currentPath)
      fetchStorageUsage()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update starred state"
      )
    }
  }

  const handleSortFieldChange = (field: SortField) => {
    setSortField(field)
    setSortOrder("asc")
  }

  const handleSortOrderToggle = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc")
  }

  return {
    files,
    selectedFiles,
    selectedIds,
    selectedFileCount,
    selectedFolderCount,
    allVisibleSelected,
    currentPath,
    sortField,
    sortOrder,
    searchQuery,
    trashMode,
    collectionMode,
    viewMode,
    loading,
    storageUsage,
    selectedFile,
    createFolderOpen,
    uploadDialogOpen,
    renameDialogOpen,
    deleteDialogOpen,
    moveDialogOpen,
    copyDialogOpen,
    shareDialogOpen,
    bulkDeleteDialogOpen,
    bulkMoveDialogOpen,
    bulkCopyDialogOpen,
    fileViewerOpen,
    setViewMode,
    setSearchQuery,
    setCollectionMode,
    setCreateFolderOpen,
    setUploadDialogOpen,
    setRenameDialogOpen,
    setDeleteDialogOpen,
    setMoveDialogOpen,
    setCopyDialogOpen,
    setShareDialogOpen,
    setBulkDeleteDialogOpen,
    setBulkMoveDialogOpen,
    setBulkCopyDialogOpen,
    setFileViewerOpen,
    setSelectedFile,
    clearSelection,
    selectAllVisible,
    toggleFileSelection,
    handleItemClick,
    handleRefresh,
    handleRename,
    handleDelete,
    handleMove,
    handleCopy,
    handleShare,
    handleDownload,
    handleBulkDownload,
    handleRestore,
    handlePermanentDelete,
    handleToggleStar,
    handleSortFieldChange,
    handleSortOrderToggle,
    navigateToPath,
  }
}
