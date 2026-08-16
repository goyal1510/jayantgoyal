"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import type { DirectoryListingItem } from "@/lib/file-manager/types"

type SortField = "name" | "date" | "size" | "type"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

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

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = React.useState(false)
  const [fileViewerOpen, setFileViewerOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<DirectoryListingItem | null>(null)

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

      const elapsed = Date.now() - (loadingStartTime.current || 0)
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)
      await new Promise(resolve => setTimeout(resolve, remainingTime))

      setFiles(data.files || [])
      setLastValidPath(normalizedPath)
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
  }, [sortField, sortOrder, lastValidPath, navigateToPath])

  React.useEffect(() => {
    if (!isFetchingRef.current && currentPath) {
      fetchFiles(currentPath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, sortField, sortOrder])

  const handleItemClick = (file: DirectoryListingItem) => {
    if (file.is_directory) {
      const folderPath = file.file_path.endsWith("/") ? file.file_path : `${file.file_path}/`
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

  const handleDownload = async (e: React.MouseEvent, file: DirectoryListingItem) => {
    e.stopPropagation()
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

      toast.success("Download started")
    } catch {
      toast.error("Failed to download file")
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
    currentPath,
    sortField,
    sortOrder,
    viewMode,
    loading,
    selectedFile,
    createFolderOpen,
    uploadDialogOpen,
    renameDialogOpen,
    deleteDialogOpen,
    moveDialogOpen,
    copyDialogOpen,
    fileViewerOpen,
    setViewMode,
    setCreateFolderOpen,
    setUploadDialogOpen,
    setRenameDialogOpen,
    setDeleteDialogOpen,
    setMoveDialogOpen,
    setCopyDialogOpen,
    setFileViewerOpen,
    setSelectedFile,
    handleItemClick,
    handleRefresh,
    handleRename,
    handleDelete,
    handleMove,
    handleCopy,
    handleDownload,
    handleSortFieldChange,
    handleSortOrderToggle,
    navigateToPath,
  }
}
