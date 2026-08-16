"use client";

import * as React from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import type { CalculationWithDenominations } from "@/lib/calculator/database";
import { Button } from "@jayant/web-ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@jayant/web-ui/sheet";
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatDateKeyLabel,
  getTotalAmount,
} from "./calculations-utils";

function EmptyState() {
  return (
    <div className="py-10 text-center text-muted-foreground">
      <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
      <p className="text-base font-medium">No calculations found yet</p>
      <p className="text-sm text-muted-foreground">
        Add a new calculation to see it appear in your timeline.
      </p>
    </div>
  );
}

interface CalculationDetailSheetProps {
  isDetailOpen: boolean;
  setIsDetailOpen: (open: boolean) => void;
  currentEntry: CalculationWithDenominations | null;
  selectedDate: string | null;
  canGoOlder: boolean;
  canGoNewer: boolean;
  loading: boolean;
  deletingId: string | null;
  navigateEntry: (direction: "prev" | "next") => void;
  handleDelete: (id: string) => void;
}

export function CalculationDetailSheet({
  isDetailOpen,
  setIsDetailOpen,
  currentEntry,
  selectedDate,
  canGoOlder,
  canGoNewer,
  loading,
  deletingId,
  navigateEntry,
  handleDelete,
}: CalculationDetailSheetProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const uniqueDenominationsUsed = currentEntry
    ? currentEntry.denominations.filter((denom) => denom.count !== 0).length
    : 0;

  const totalNotesCount = currentEntry
    ? currentEntry.denominations.reduce((sum, denom) => sum + denom.count, 0)
    : 0;

  const noteCountBadge =
    totalNotesCount >= 0 ? "text-emerald-600" : "text-destructive";

  const handleDownload = async () => {
    if (!currentEntry || isDownloading) return;

    setIsDownloading(true);
    try {
      const { generateCalculationPDF } = await import(
        "@/lib/calculator/generate-pdf"
      );
      generateCalculationPDF(currentEntry);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("Failed to generate calculation PDF:", error);
      toast.error("Could not generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col sm:max-w-xl"
      >
        {!currentEntry ? (
          <EmptyState />
        ) : (
          <>
            <SheetHeader className="pb-2">
              <div className="space-y-2">
                <SheetTitle className="flex items-start gap-2 text-base leading-tight sm:text-lg">
                  <History className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-2">
                    {currentEntry.note || "No note added"}
                  </span>
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {formatDateDisplay(
                      currentEntry.ist_timestamp || currentEntry.created_at,
                    )}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {formatTimeDisplay(
                      currentEntry.ist_timestamp || currentEntry.created_at,
                    )}{" "}
                    IST
                  </span>
                  {selectedDate ? (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      Filtered to {formatDateKeyLabel(selectedDate)}
                    </span>
                  ) : null}
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 pt-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Total amount</p>
                  <p
                    className={`text-xl font-semibold ${
                      getTotalAmount(currentEntry.denominations) >= 0
                        ? "text-emerald-600"
                        : "text-destructive"
                    }`}
                  >
                    ₹
                    {getTotalAmount(
                      currentEntry.denominations,
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Unique denominations
                  </p>
                  <p className="text-xl font-semibold">
                    {uniqueDenominationsUsed}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Total notes counted
                  </p>
                  <p className={`text-xl font-semibold ${noteCountBadge}`}>
                    {totalNotesCount}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30">
                <div className="flex items-center justify-between border-b px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4" />
                    Denomination breakdown
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {currentEntry.denominations.length} lines
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-lg border bg-background shadow-sm"
                  style={{
                    width: "100%",
                    maxWidth: "100vw",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <table className="w-full">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="sticky left-0 z-20 w-28 bg-muted/70 px-3 py-2 text-left text-sm font-semibold text-muted-foreground">
                          Denomination
                        </th>
                        <th className="w-24 px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                          Count
                        </th>
                        <th className="w-28 px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEntry.denominations
                        .slice()
                        .sort((a, b) => b.denomination - a.denomination)
                        .map((denom) => (
                          <tr
                            key={denom.id}
                            className="group/row bg-background transition-colors hover:bg-muted"
                          >
                            <td className="sticky left-0 z-10 w-28 bg-background px-3 py-2 transition-colors group-hover/row:bg-muted">
                              <div className="text-base font-semibold text-foreground">
                                ₹{denom.denomination}
                              </div>
                            </td>
                            <td className="w-24 px-3 py-2 text-center">
                              <div
                                className={`text-base font-medium ${
                                  denom.count >= 0
                                    ? "text-foreground"
                                    : "text-destructive"
                                }`}
                              >
                                {denom.count}
                              </div>
                            </td>
                            <td className="w-28 px-3 py-2 text-center">
                              <div
                                className={`text-base font-semibold ${
                                  denom.total && denom.total >= 0
                                    ? "text-emerald-600"
                                    : "text-destructive"
                                }`}
                              >
                                ₹
                                {(
                                  denom.denomination * denom.count
                                ).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:px-5">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateEntry("prev")}
                  disabled={!canGoOlder || loading}
                  aria-label="Previous entry"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateEntry("next")}
                  disabled={!canGoNewer || loading}
                  aria-label="Next entry"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Preparing…" : "PDF"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(currentEntry.id)}
                  disabled={deletingId === currentEntry.id}
                  className="gap-1 sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === currentEntry.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
