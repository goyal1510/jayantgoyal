"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Clock, History } from "lucide-react";

import type { CalculationWithDenominations } from "@/lib/calculator/database";
import { Button } from "@repo/ui/button";

import {
  formatDateDisplay,
  formatTimeDisplay,
  getTotalAmount,
} from "./calculations-utils";

interface CalculationsTableProps {
  filteredEntries: CalculationWithDenominations[];
  currentEntry: CalculationWithDenominations | null;
  loading: boolean;
  hasLoaded: boolean;
  page: number;
  pageCount: number;
  effectivePageCount: number;
  pageOptions: number[];
  totalEntries: number;
  pageSize: number;
  activeEntryPosition: number;
  onPageChange: (page: number, options?: { target?: "first" | "last" }) => void;
  onRowSelect: (entryId: string) => void;
}

export function CalculationsTable({
  filteredEntries,
  currentEntry,
  loading,
  hasLoaded,
  page,
  pageCount,
  effectivePageCount,
  pageOptions,
  totalEntries,
  pageSize,
  activeEntryPosition,
  onPageChange,
  onRowSelect,
}: CalculationsTableProps) {
  const renderEmptyState = () => (
    <div className="py-10 text-center text-muted-foreground">
      <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
      <p className="text-base font-medium">No calculations found yet</p>
      <p className="text-sm text-muted-foreground">
        Add a new calculation to see it appear in your timeline.
      </p>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.035em] text-foreground">
              <Clock className="h-4 w-4" />
              Entries
            </div>
            <p className="text-sm text-muted-foreground">
              Select a row to open its denomination breakdown.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && hasLoaded ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1, { target: "last" })}
              disabled={loading || page === 0 || !filteredEntries.length}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <select
              value={Math.min(page + 1, pageCount)}
              onChange={(event) =>
                onPageChange(Math.max(0, Number(event.target.value) - 1), {
                  target: "first",
                })
              }
              className="rounded-md border bg-background px-2 py-1 text-sm"
              disabled={!filteredEntries.length}
            >
              {pageOptions.map((num) => (
                <option key={num} value={num}>
                  Page {num}
                </option>
              ))}
            </select>
            <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Page {Math.min(page + 1, effectivePageCount)} /{" "}
              {effectivePageCount}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1, { target: "first" })}
              disabled={
                loading ||
                page >= effectivePageCount - 1 ||
                !filteredEntries.length
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/80">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-[45%]" />
              <col className="w-28" />
            </colgroup>
            <thead className="bg-muted/70">
              <tr className="text-left">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {!filteredEntries.length ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6">
                    {renderEmptyState()}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const total = getTotalAmount(entry.denominations);
                  const isActive = currentEntry?.id === entry.id;
                  const dateLabel = formatDateDisplay(
                    entry.ist_timestamp || entry.created_at,
                  );
                  const timeLabel = formatTimeDisplay(
                    entry.ist_timestamp || entry.created_at,
                  );

                  return (
                    <tr
                      key={entry.id}
                      className={`cursor-pointer border-b transition hover:bg-muted/60 ${
                        isActive ? "bg-primary/5" : ""
                      }`}
                      onClick={() => onRowSelect(entry.id)}
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-medium">
                        {dateLabel}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        {timeLabel}
                      </td>
                      <td className="max-w-0 px-3 py-3 text-muted-foreground">
                        <span className="block truncate">
                          {entry.note || "No note"}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          total >= 0 ? "text-emerald-600" : "text-destructive"
                        }`}
                      >
                        ₹{total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {totalEntries && filteredEntries.length
              ? `Viewing entry ${activeEntryPosition || 1} of ${totalEntries}`
              : "No entries to display"}
          </span>
          <span>
            Page {Math.min(page + 1, pageCount)} · {pageSize} rows per page
          </span>
        </div>
      </div>
    </section>
  );
}
