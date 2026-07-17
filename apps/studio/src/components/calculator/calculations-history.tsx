"use client";

import * as React from "react";
import Link from "next/link";
import { Banknote, Plus } from "lucide-react";

import {
  deleteCalculation,
  getCalculations,
} from "@/lib/calculator/client-calculations";
import type { CalculationWithDenominations } from "@/lib/calculator/database";
import { Button } from "@repo/ui/button";
import { PageSpinner } from "@repo/ui/page-spinner";
import { StudioWorkspaceHeader } from "@/components/studio/studio-workspace-header";

import { CalculationHistoryFilters } from "./calculation-history-filters";
import { CalculationDetailSheet } from "./calculation-detail-sheet";
import { CalculationsTable } from "./calculations-table";
import {
  type AmountFilter,
  type LoadOptions,
  parseISTTimestamp,
  getTotalAmount,
} from "./calculations-utils";

export function CalculationsHistory() {
  const [entries, setEntries] = React.useState<CalculationWithDenominations[]>(
    [],
  );
  const [availableDates, setAvailableDates] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [amountFilter, setAmountFilter] = React.useState<AmountFilter>("all");
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [totalEntries, setTotalEntries] = React.useState(0);
  const [pageSize] = React.useState(10);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const activeEntryIdRef = React.useRef<string | null>(null);
  const pendingNavigationRef = React.useRef<LoadOptions | null>(null);

  const loadCalculations = React.useCallback(
    async (pageIndex: number, options?: LoadOptions) => {
      try {
        setLoading(true);
        const response = await getCalculations({
          page: pageIndex + 1,
          pageSize,
          search: searchTerm.trim() || undefined,
          date: selectedDate || undefined,
        });
        const sortedEntries = [...response.items].sort((a, b) => {
          const aDate =
            parseISTTimestamp(
              a.ist_timestamp || a.created_at || "",
            )?.getTime() ?? 0;
          const bDate =
            parseISTTimestamp(
              b.ist_timestamp || b.created_at || "",
            )?.getTime() ?? 0;
          return bDate - aDate;
        });

        const existing = sortedEntries.find(
          (entry) => entry.id === activeEntryIdRef.current,
        )?.id;
        const targetId =
          existing ||
          (options?.target === "last"
            ? (sortedEntries[sortedEntries.length - 1]?.id ?? null)
            : (sortedEntries[0]?.id ?? null));

        setEntries(sortedEntries);
        setAvailableDates(
          response.availableDates ? response.availableDates : [],
        );
        setTotalEntries(response.total);
        setActiveEntryId(targetId ?? null);
        if (options?.keepDetailOpen && targetId) {
          setIsDetailOpen(true);
        }
      } catch (error) {
        console.error("Error loading calculations:", error);
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    },
    [pageSize, searchTerm, selectedDate],
  );

  React.useEffect(() => {
    activeEntryIdRef.current = activeEntryId;
  }, [activeEntryId]);

  React.useEffect(() => {
    pendingNavigationRef.current = { target: "first" };
    setPage(0);
  }, [searchTerm, selectedDate]);

  React.useEffect(() => {
    const options = pendingNavigationRef.current ?? undefined;
    pendingNavigationRef.current = null;
    void loadCalculations(page, options);
  }, [loadCalculations, page]);

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      const total = getTotalAmount(entry.denominations);
      return amountFilter === "positive"
        ? total >= 0
        : amountFilter === "negative"
          ? total < 0
          : true;
    });
  }, [amountFilter, entries]);

  const activeEntryIndex = filteredEntries.findIndex(
    (entry) => entry.id === activeEntryId,
  );
  const effectiveTotal =
    amountFilter === "all" ? totalEntries : filteredEntries.length;
  const effectivePageCount = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const pageCount = Math.max(1, Math.ceil(totalEntries / pageSize));
  const pageOptions = React.useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );

  const handlePageChange = React.useCallback(
    (nextPage: number, options?: LoadOptions) => {
      const safePage = Math.max(
        0,
        Math.min(nextPage, Math.max(0, effectivePageCount - 1)),
      );
      pendingNavigationRef.current = options ?? null;
      setPage(safePage);
    },
    [effectivePageCount],
  );

  React.useEffect(() => {
    if (!filteredEntries.length) {
      setActiveEntryId(null);
      setIsDetailOpen(false);
      return;
    }
    if (!activeEntryId || activeEntryIndex === -1) {
      const first = filteredEntries[0];
      if (first) setActiveEntryId(first.id);
    }
  }, [activeEntryId, activeEntryIndex, filteredEntries]);

  const currentEntry =
    filteredEntries[activeEntryIndex !== -1 ? activeEntryIndex : 0] ?? null;

  React.useEffect(() => {
    const maxPage = Math.max(0, pageCount - 1);
    if (page > maxPage) setPage(maxPage);
  }, [page, pageCount]);

  const navigateEntry = (direction: "prev" | "next") => {
    if (!filteredEntries.length || activeEntryIndex === -1 || loading) return;
    if (direction === "prev") {
      if (activeEntryIndex < filteredEntries.length - 1) {
        const next = filteredEntries[activeEntryIndex + 1];
        if (next) {
          setActiveEntryId(next.id);
          setIsDetailOpen(true);
        }
      } else if (page < pageCount - 1) {
        handlePageChange(page + 1, { target: "first", keepDetailOpen: true });
      }
    } else {
      if (activeEntryIndex > 0) {
        const prev = filteredEntries[activeEntryIndex - 1];
        if (prev) {
          setActiveEntryId(prev.id);
          setIsDetailOpen(true);
        }
      } else if (page > 0) {
        handlePageChange(page - 1, { target: "last", keepDetailOpen: true });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation?")) return;
    try {
      setDeletingId(id);
      await deleteCalculation(id);
      const nextPage =
        page > 0 && filteredEntries.length === 1 ? page - 1 : page;
      pendingNavigationRef.current = {
        target: "first",
        keepDetailOpen: isDetailOpen,
      };
      setPage(nextPage);
    } catch (error) {
      console.error("Error deleting calculation:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const activeEntryPosition =
    currentEntry && filteredEntries.length
      ? page * pageSize +
        filteredEntries.findIndex((e) => e.id === currentEntry.id) +
        1
      : 0;

  const canGoOlder =
    filteredEntries.length && activeEntryIndex >= 0
      ? activeEntryIndex < filteredEntries.length - 1 || page < pageCount - 1
      : false;
  const canGoNewer =
    filteredEntries.length && activeEntryIndex >= 0
      ? activeEntryIndex > 0 || page > 0
      : false;

  if (loading && !hasLoaded) return <PageSpinner />;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <StudioWorkspaceHeader
        icon={Banknote}
        title="Currency History"
        description="Find a saved count, review its denomination breakdown, or continue with a new calculation."
        tone="sage"
        actions={
          <Button
            asChild
            className="h-11 rounded-xl bg-[#211512] px-5 text-[#fff8ef] shadow-none hover:bg-[#211512]/90 dark:bg-[#fff8ef] dark:text-[#211512] dark:hover:bg-[#fff8ef]/90"
          >
            <Link href="/calculator/new">
              <Plus className="size-4" />
              New calculation
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <CalculationHistoryFilters
          searchTerm={searchTerm}
          amountFilter={amountFilter}
          selectedDate={selectedDate}
          availableDates={availableDates}
          onSearchTermChange={setSearchTerm}
          onAmountFilterChange={setAmountFilter}
          onSelectedDateChange={setSelectedDate}
          onResetPage={() => handlePageChange(0, { target: "first" })}
        />

        <CalculationsTable
          filteredEntries={filteredEntries}
          currentEntry={currentEntry}
          loading={loading}
          hasLoaded={hasLoaded}
          page={page}
          pageCount={pageCount}
          effectivePageCount={effectivePageCount}
          pageOptions={pageOptions}
          totalEntries={totalEntries}
          pageSize={pageSize}
          activeEntryPosition={activeEntryPosition}
          onPageChange={handlePageChange}
          onRowSelect={(id) => {
            setActiveEntryId(id);
            setIsDetailOpen(true);
          }}
        />

        <CalculationDetailSheet
          isDetailOpen={isDetailOpen}
          setIsDetailOpen={setIsDetailOpen}
          currentEntry={currentEntry}
          selectedDate={selectedDate}
          canGoOlder={canGoOlder}
          canGoNewer={canGoNewer}
          loading={loading}
          deletingId={deletingId}
          navigateEntry={navigateEntry}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}
