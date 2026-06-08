"use client"

import Link from "next/link"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { HardDrive, FileText, Folder, Star, Clock } from "lucide-react"
import { formatFileSize } from "@/lib/file-manager/format-utils"

export interface StorageUsage {
  usedBytes: number
  plan?: "free" | "pro"
  isPro?: boolean
  storageLimitBytes?: number
  storageRemainingBytes?: number
  singleUploadLimitBytes?: number
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
  const storageLimitBytes = usage.storageLimitBytes ?? 50 * 1024 * 1024
  const percentUsed = Math.min(100, Math.round((usage.usedBytes / storageLimitBytes) * 100))

  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatFileSize(usage.usedBytes)}</span>
              <span className="text-muted-foreground">
                of {formatFileSize(storageLimitBytes)}
              </span>
              <Badge variant={usage.isPro ? "default" : "secondary"} className="capitalize">
                {usage.plan ?? "free"}
              </Badge>
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

          <div className="flex flex-wrap items-center gap-2">
            {topTypes.map(([type, bytes]) => (
              <Badge key={type} variant="secondary" className="capitalize">
                {type}: {formatFileSize(bytes)}
              </Badge>
            ))}
            {!usage.isPro && (
              <Button asChild size="sm" variant="outline" className="h-7">
                <Link href="/pricing">Upgrade storage</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  )
}
