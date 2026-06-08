"use client"

import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,

  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/breadcrumb"
import { Input } from "@repo/ui/input"
import { Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, FolderPlus, Upload, Plus, Ellipsis, Search, X, Trash2, FolderOpen, Clock, Star } from "lucide-react"
import type { FileCollectionMode } from "@/components/file-manager/use-file-list"

type SortField = "name" | "date" | "size" | "type"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

interface FileListToolbarProps {
  currentPath: string
  sortField: SortField
  sortOrder: SortOrder
  viewMode: ViewMode
  searchQuery: string
  collectionMode: FileCollectionMode
  onSortFieldChange: (field: SortField) => void
  onSortOrderToggle: () => void
  onViewModeChange: (mode: ViewMode) => void
  onSearchQueryChange: (query: string) => void
  onCollectionModeChange: (mode: FileCollectionMode) => void
  onUploadClick: () => void
  onCreateFolderClick: () => void
  onBreadcrumbClick: (path: string) => void
}

function getBreadcrumbSegments(path: string) {
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

export function FileListToolbar({
  currentPath,
  sortField,
  sortOrder,
  viewMode,
  searchQuery,
  collectionMode,
  onSortFieldChange,
  onSortOrderToggle,
  onViewModeChange,
  onSearchQueryChange,
  onCollectionModeChange,
  onUploadClick,
  onCreateFolderClick,
  onBreadcrumbClick,
}: FileListToolbarProps) {
  const specialCollectionLabel =
    collectionMode === "recent"
      ? "Recent"
      : collectionMode === "starred"
        ? "Starred"
        : collectionMode === "trash"
          ? "Trash"
          : null
  const getSortIcon = () => {
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      onSortOrderToggle()
    } else {
      onSortFieldChange(field)
    }
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {specialCollectionLabel ? (
            <BreadcrumbItem>
              <BreadcrumbPage>{specialCollectionLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            (() => {
              const segments = getBreadcrumbSegments(currentPath)
              const currentSegment = segments[segments.length - 1]
              const parentSegments = segments.slice(0, -1)

              if (parentSegments.length > 0) {
                return (
                  <>
                    <BreadcrumbItem>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 gap-1"
                            aria-label="Show parent folders"
                            title="Show parent folders"
                          >
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {parentSegments.map((segment) => (
                            <DropdownMenuItem
                              key={segment.path}
                              onClick={() => onBreadcrumbClick(segment.path)}
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

              return (
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentSegment?.name}</BreadcrumbPage>
                </BreadcrumbItem>
              )
            })()
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={
              collectionMode === "files"
                ? "Search this folder"
                : `Search ${specialCollectionLabel?.toLowerCase()}`
            }
            className="h-9 pl-8 pr-8"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => onSearchQueryChange("")}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {collectionMode === "files" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-1"
                aria-label="Create or upload"
                title="Create or upload"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onUploadClick} className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateFolderClick} className="cursor-pointer">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center rounded-md border">
          <Button
            variant={collectionMode === "files" ? "default" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => onCollectionModeChange("files")}
            aria-label="Show files"
            title="Show files"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="hidden lg:ml-1 lg:inline">Files</span>
          </Button>
          <Button
            variant={collectionMode === "recent" ? "default" : "ghost"}
            size="sm"
            className="rounded-none border-l"
            onClick={() => onCollectionModeChange("recent")}
            aria-label="Show recent files"
            title="Show recent files"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden lg:ml-1 lg:inline">Recent</span>
          </Button>
          <Button
            variant={collectionMode === "starred" ? "default" : "ghost"}
            size="sm"
            className="rounded-none border-l"
            onClick={() => onCollectionModeChange("starred")}
            aria-label="Show starred files"
            title="Show starred files"
          >
            <Star className="h-4 w-4" />
            <span className="hidden lg:ml-1 lg:inline">Starred</span>
          </Button>
          <Button
            variant={collectionMode === "trash" ? "default" : "ghost"}
            size="sm"
            className="rounded-l-none border-l"
            onClick={() => onCollectionModeChange("trash")}
            aria-label="Show trash"
            title="Show trash"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden lg:ml-1 lg:inline">Trash</span>
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Sort: {sortField}</span>
              {getSortIcon()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSortClick("name")}>
              Name {sortField === "name" && getSortIcon()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortClick("date")}>
              Date {sortField === "date" && getSortIcon()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortClick("size")}>
              Size {sortField === "size" && getSortIcon()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortClick("type")}>
              Type {sortField === "type" && getSortIcon()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:flex items-center border rounded-md">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className="rounded-l-none"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
            title="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
