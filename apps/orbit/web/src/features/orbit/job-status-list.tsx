"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@jayantgoyal/web-ui/badge";
import { Button } from "@jayantgoyal/web-ui/button";

import { usePendingJobPolling } from "@/features/orbit/use-pending-job-polling";

export type JobStatusRow = {
  id: string;
  status: string;
  createdAt: string;
  processedAt?: string | null;
  result?: Record<string, unknown> | null;
};

type JobStatusListProps = {
  jobs: JobStatusRow[];
  emptyLabel?: string;
  onDownload?: (jobId: string) => void;
  downloadPending?: boolean;
};

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ready" || status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "processing") return "secondary";
  return "outline";
}

function formatWhen(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export function JobStatusList({
  jobs,
  emptyLabel = "No jobs yet.",
  onDownload,
  downloadPending = false,
}: JobStatusListProps) {
  usePendingJobPolling(jobs);

  if (!jobs.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {jobs.map((job) => {
        const isActive = job.status === "pending" || job.status === "processing";
        const importedCount = job.result?.imported_count;

        return (
          <li
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(job.status)} className="capitalize">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {job.status}
                    </span>
                  ) : (
                    job.status
                  )}
                </Badge>
                <span className="text-muted-foreground">{formatWhen(job.createdAt)}</span>
              </div>
              {typeof importedCount === "number" ? (
                <p className="text-xs text-muted-foreground">Imported {importedCount} card(s)</p>
              ) : null}
              {job.processedAt ? (
                <p className="text-xs text-muted-foreground">
                  Finished {formatWhen(job.processedAt)}
                </p>
              ) : null}
            </div>
            {job.status === "ready" && onDownload ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={downloadPending}
                onClick={() => onDownload(job.id)}
              >
                Download
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
