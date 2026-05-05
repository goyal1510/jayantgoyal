"use client";

import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { PriorityBadge, ScoreBadge, StatusBadge } from "./badges";
import type { JobListing } from "@/lib/types";

function formatINR(n: number | null) {
  if (!n) return null;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

const columns: ColumnDef<JobListing>[] = [
  {
    id: "score",
    header: "",
    size: 56,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <ScoreBadge score={row.original.ai_score} size="sm" />
      </div>
    ),
  },
  {
    id: "title",
    header: "Role",
    cell: ({ row }) => {
      const l = row.original;
      return (
        <div className="min-w-0 max-w-md">
          <div className="truncate font-medium leading-snug">{l.title}</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{l.company}</span>
            {l.source_kind && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase tracking-wide">
                {l.source_kind === "hn_hiring" ? "hn" : l.source_kind}
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "location",
    header: "Location",
    size: 180,
    cell: ({ row }) => {
      const l = row.original;
      const loc = l.location ?? (l.is_remote ? "Remote" : "—");
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{loc}</span>
          {l.is_india && (
            <Badge variant="outline" className="h-4 shrink-0 px-1 text-[9px]">
              IN
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "salary",
    header: "Salary",
    size: 96,
    cell: ({ row }) => {
      const l = row.original;
      if (!l.salary_min_inr && !l.salary_max_inr) {
        return <span className="text-xs text-muted-foreground/60">—</span>;
      }
      const lo = formatINR(l.salary_min_inr);
      const hi = formatINR(l.salary_max_inr);
      const text = lo && hi && hi !== lo ? `${lo}–${hi}` : lo ?? hi ?? "";
      return (
        <span className="flex items-center gap-1 text-xs tabular-nums">
          <IndianRupee className="h-3 w-3 text-muted-foreground" />
          {text}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    size: 160,
    cell: ({ row }) => {
      const app = row.original.application;
      if (!app) {
        return <span className="text-xs text-muted-foreground/60">—</span>;
      }
      return (
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge status={app.status} />
          <PriorityBadge priority={app.priority} />
        </div>
      );
    },
  },
  {
    id: "posted",
    header: "Posted",
    size: 64,
    cell: ({ row }) => (
      <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
        <Calendar className="h-3 w-3" />
        {timeAgo(row.original.posted_at)}
      </span>
    ),
  },
  {
    id: "apply",
    header: "",
    size: 36,
    cell: ({ row }) => (
      <a
        href={row.original.apply_url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-foreground"
        title="Open apply URL"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    ),
  },
];

export function ListingsTable({
  data,
  loading,
  detailHrefBuilder,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  data: JobListing[];
  loading: boolean;
  detailHrefBuilder: (id: string) => string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const router = useRouter();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-3 py-1.5 text-left font-medium"
                    style={{ width: h.getSize() ? `${h.getSize()}px` : undefined }}
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-muted-foreground"
                >
                  No listings match.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b last:border-b-0 transition-colors hover:bg-muted/40"
                  onClick={() => router.push(detailHrefBuilder(row.original.id))}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="max-w-0 px-3 py-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground tabular-nums">
          Page {page} of {totalPages} · {total.toLocaleString()} total
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="h-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="h-7"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
