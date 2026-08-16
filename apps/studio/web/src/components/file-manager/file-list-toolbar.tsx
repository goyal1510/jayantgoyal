"use client";

import { Button } from "@jayant/web-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@jayant/web-ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@jayant/web-ui/breadcrumb";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ellipsis,
  FolderPlus,
  Grid3x3,
  List,
  Upload,
} from "lucide-react";

type SortField = "name" | "date" | "size" | "type";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "list";

interface FileListToolbarProps {
  currentPath: string;
  sortField: SortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderToggle: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
  onBreadcrumbClick: (path: string) => void;
}

function getBreadcrumbSegments(path: string) {
  if (path === "/") {
    return [{ name: "Home", path: "/" }];
  }

  const segments = path.split("/").filter(Boolean);
  const breadcrumbs = [{ name: "Home", path: "/" }];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      name: segment,
      path: currentPath + "/",
    });
  }

  return breadcrumbs;
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
    );
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      onSortOrderToggle();
    } else {
      onSortFieldChange(field);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-none sm:flex-row sm:items-center sm:justify-between">
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {(() => {
            const segments = getBreadcrumbSegments(currentPath);
            const currentSegment = segments[segments.length - 1];
            const parentSegments = segments.slice(0, -1);

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
              );
            }

            return (
              <BreadcrumbItem>
                <BreadcrumbPage>{currentSegment?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            );
          })()}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button
          type="button"
          size="sm"
          onClick={onUploadClick}
          className="h-9 rounded-lg px-4 shadow-none"
        >
          <Upload className="size-4" />
          Upload files
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreateFolderClick}
          className="h-9 rounded-lg px-4 shadow-none"
        >
          <FolderPlus className="size-4" />
          New folder
        </Button>

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
  );
}
