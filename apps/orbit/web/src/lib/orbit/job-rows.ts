import type { JobStatusRow } from "@/features/orbit/job-status-list";

/** Normalizes export/import RPC rows for the shared job status list. */
export function toJobStatusRows(rows: Array<Record<string, unknown>>): JobStatusRow[] {
  return rows.map((row) => ({
    id: String(row.id),
    status: String(row.status),
    createdAt: String(row.created_at),
    processedAt: row.processed_at ? String(row.processed_at) : null,
    result: (row.result as Record<string, unknown> | null | undefined) ?? null,
  }));
}
