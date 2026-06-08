"use client"

import { Badge } from "@repo/ui/badge"
import { HardDrive, FileText, Folder, Star, Clock } from "lucide-react"
import { formatFileSize } from "@/lib/file-manager/format-utils"

export interface StorageUsage {
  usedBytes: number
  fileCount: number
  folderCount: number
  starredCount: number
  recentCount: number
  usageByType: Record<string, number>
}

interface StorageSummaryProps {
  usage: StorageUsage | null
}

export function StorageSummary({ usage }: StorageSummaryProps) {
  if (!usage) return null

  const topTypes = Object.entries(usage.usageByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatFileSize(usage.usedBytes)}</span>
            <span className="text-muted-foreground">used</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{usage.fileCount} files</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span>{usage.folderCount} folders</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>{usage.starredCount} starred</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{usage.recentCount} recent</span>
          </div>
        </div>

        {topTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topTypes.map(([type, bytes]) => (
              <Badge key={type} variant="secondary" className="capitalize">
                {type}: {formatFileSize(bytes)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
