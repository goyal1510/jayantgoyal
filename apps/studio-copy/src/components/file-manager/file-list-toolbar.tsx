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
import { Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, FolderPlus, Upload, Plus, Ellipsis } from "lucide-react"

type SortField = "name" | "date" | "size" | "type"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

interface FileListToolbarProps {
  currentPath: string
  sortField: SortField
  sortOrder: SortOrder
  viewMode: ViewMode
  onSortFieldChange: (field: SortField) => void
  onSortOrderToggle: () => void
  onViewModeChange: (mode: ViewMode) => void
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
  onSortFieldChange,
  onSortOrderToggle,
  onViewModeChange,
  onUploadClick,
  onCreateFolderClick,
  onBreadcrumbClick,
}: FileListToolbarProps) {
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
    <div className="flex items-center justify-between gap-2">
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {(() => {
            const segments = getBreadcrumbSegments(currentPath)
            const currentSegment = segments[segments.length - 1]
            const parentSegments = segments.slice(0, -1)

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
          })()}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-1">
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
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className="rounded-l-none"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
