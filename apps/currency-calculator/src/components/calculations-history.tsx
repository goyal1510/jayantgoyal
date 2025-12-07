"use client"

import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight, Clock, History, Search, Trash2 } from "lucide-react"

import { deleteCalculation, getCalculations } from "@/lib/api/client-calculations"
import type { CalculationWithDenominations } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type AmountFilter = "all" | "positive" | "negative"
type LoadOptions = {
  target?: "first" | "last"
  keepDetailOpen?: boolean
}

export function CalculationsHistory() {
  const [entries, setEntries] = React.useState<CalculationWithDenominations[]>([])
  const [availableDates, setAvailableDates] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [activeEntryId, setActiveEntryId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [amountFilter, setAmountFilter] = React.useState<AmountFilter>("all")
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(0)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [totalEntries, setTotalEntries] = React.useState(0)
  const [pageSize] = React.useState(10)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const activeEntryIdRef = React.useRef<string | null>(null)
  const pendingNavigationRef = React.useRef<LoadOptions | null>(null)

  const parseISTTimestamp = (timestamp: string) => {
    try {
      if (timestamp.includes("T") || timestamp.includes("Z")) {
        const date = new Date(timestamp)
        return isNaN(date.getTime()) ? null : date
      }

      const parts = timestamp.split(" ")
      if (parts.length !== 2) return null

      const [day, month, year] = parts[0]?.split("/") ?? []
      const [hours, minutes, seconds] = parts[1]?.split(":") ?? []
      if (!day || !month || !year || !hours || !minutes || !seconds) return null

      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )
      return isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }

  const formatDateDisplay = (timestamp: string | null) => {
    if (!timestamp) return "Invalid Date"
    const date = parseISTTimestamp(timestamp)
    if (!date) return "Invalid Date"
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatTimeDisplay = (timestamp: string | null) => {
    if (!timestamp) return "Invalid Time"
    const date = parseISTTimestamp(timestamp)
    if (!date) return "Invalid Time"
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDateKeyLabel = (key: string) => {
    const [year, month, day] = key.split("-")
    if (!year || !month || !day) return key
    return `${day}/${month}/${year}`
  }

  const getTotalAmount = (denominations: { denomination: number; count: number }[]) =>
    denominations.reduce((total, denom) => total + denom.denomination * denom.count, 0)

  const loadCalculations = React.useCallback(
    async (pageIndex: number, options?: LoadOptions) => {
    try {
      setLoading(true)
      const response = await getCalculations({
        page: pageIndex + 1,
        pageSize,
        search: searchTerm.trim() || undefined,
        date: selectedDate || undefined,
      })
      const sortedEntries = [...response.items].sort((a, b) => {
        const aDate = parseISTTimestamp(a.ist_timestamp || a.created_at || "")?.getTime() ?? 0
        const bDate = parseISTTimestamp(b.ist_timestamp || b.created_at || "")?.getTime() ?? 0
        return bDate - aDate
      })

      const existing = sortedEntries.find((entry) => entry.id === activeEntryIdRef.current)?.id
      const targetId =
        existing ||
        (options?.target === "last"
          ? sortedEntries[sortedEntries.length - 1]?.id ?? null
          : sortedEntries[0]?.id ?? null)

      setEntries(sortedEntries)
      setAvailableDates(
        response.availableDates ? response.availableDates : []
      )
      setTotalEntries(response.total)
      setActiveEntryId(targetId ?? null)
      if (options?.keepDetailOpen && targetId) {
        setIsDetailOpen(true)
      }
    } catch (error) {
      console.error("Error loading calculations:", error)
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
    },
    [pageSize, searchTerm, selectedDate]
  )

  React.useEffect(() => {
    activeEntryIdRef.current = activeEntryId
  }, [activeEntryId])

  React.useEffect(() => {
    pendingNavigationRef.current = { target: "first" }
    setPage(0)
  }, [searchTerm, selectedDate])

  React.useEffect(() => {
    const options = pendingNavigationRef.current ?? undefined
    pendingNavigationRef.current = null
    void loadCalculations(page, options)
  }, [loadCalculations, page])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation?")) return
    try {
      setDeletingId(id)
      await deleteCalculation(id)
      const nextPage = page > 0 && filteredEntries.length === 1 ? page - 1 : page
      pendingNavigationRef.current = { target: "first", keepDetailOpen: isDetailOpen }
      setPage(nextPage)
    } catch (error) {
      console.error("Error deleting calculation:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      const total = getTotalAmount(entry.denominations)
      const matchesAmount =
        amountFilter === "positive"
          ? total >= 0
          : amountFilter === "negative"
            ? total < 0
            : true

      return matchesAmount
    })
  }, [amountFilter, entries])

  const activeEntryIndex = filteredEntries.findIndex(
    (entry) => entry.id === activeEntryId
  )

  const effectiveTotal = amountFilter === "all" ? totalEntries : filteredEntries.length
  const effectivePageCount = Math.max(1, Math.ceil(effectiveTotal / pageSize))

  const pageCount = Math.max(1, Math.ceil(totalEntries / pageSize))
  const pageOptions = React.useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount]
  )
  const paginatedEntries = filteredEntries

  const handlePageChange = React.useCallback(
    (nextPage: number, options?: LoadOptions) => {
      const safePage = Math.max(0, Math.min(nextPage, Math.max(0, effectivePageCount - 1)))
      pendingNavigationRef.current = options ?? null
      setPage(safePage)
    },
    [effectivePageCount]
  )

  React.useEffect(() => {
    if (!filteredEntries.length) {
      setActiveEntryId(null)
      setIsDetailOpen(false)
      return
    }
    if (!activeEntryId || activeEntryIndex === -1) {
      const first = filteredEntries[0]
      if (first) {
        setActiveEntryId(first.id)
      }
    }
  }, [activeEntryId, activeEntryIndex, filteredEntries])

  const currentEntry =
    filteredEntries[activeEntryIndex !== -1 ? activeEntryIndex : 0] ?? null

  React.useEffect(() => {
    const maxPage = Math.max(0, pageCount - 1)
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [page, pageCount])

  const navigateEntry = (direction: "prev" | "next") => {
    if (!filteredEntries.length || activeEntryIndex === -1 || loading) return
    const index = activeEntryIndex

    if (direction === "prev") {
      if (index < filteredEntries.length - 1) {
        const nextEntry = filteredEntries[index + 1]
        if (nextEntry) {
          setActiveEntryId(nextEntry.id)
          setIsDetailOpen(true)
        }
      } else if (page < pageCount - 1) {
        handlePageChange(page + 1, { target: "first", keepDetailOpen: true })
      }
    } else {
      if (index > 0) {
        const prevEntry = filteredEntries[index - 1]
        if (prevEntry) {
          setActiveEntryId(prevEntry.id)
          setIsDetailOpen(true)
        }
      } else if (page > 0) {
        handlePageChange(page - 1, { target: "last", keepDetailOpen: true })
      }
    }
  }

  const handleDateSelect = (value: string) => {
    if (!value) {
      setSelectedDate(null)
      handlePageChange(0, { target: "first" })
      return
    }

    handlePageChange(0, { target: "first" })
    setSelectedDate(value)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setAmountFilter("all")
    setSelectedDate(null)
    handlePageChange(0, { target: "first" })
  }

  const handleRowSelect = (entryId: string) => {
    setActiveEntryId(entryId)
    setIsDetailOpen(true)
  }

  const activeEntryPosition =
    currentEntry && filteredEntries.length
      ? page * pageSize + filteredEntries.findIndex((entry) => entry.id === currentEntry.id) + 1
      : 0

  const pageRangeStart = effectiveTotal && filteredEntries.length ? page * pageSize + 1 : 0
  const pageRangeEnd =
    effectiveTotal && filteredEntries.length
      ? Math.min(effectiveTotal, page * pageSize + filteredEntries.length)
      : 0
  const pageVisibleCount = filteredEntries.length

  const canGoOlder =
    filteredEntries.length && activeEntryIndex >= 0
      ? activeEntryIndex < filteredEntries.length - 1 || page < pageCount - 1
      : false

  const canGoNewer =
    filteredEntries.length && activeEntryIndex >= 0 ? activeEntryIndex > 0 || page > 0 : false

  const uniqueDenominationsUsed = currentEntry
    ? currentEntry.denominations.filter((denom) => denom.count !== 0).length
    : 0

  const totalNotesCount = currentEntry
    ? currentEntry.denominations.reduce((sum, denom) => sum + denom.count, 0)
    : 0

  const noteCountBadge =
    totalNotesCount >= 0 ? "text-emerald-600" : "text-destructive"

  const handlePrevPage = () => {
    handlePageChange(page - 1, { target: "last" })
  }

  const handleNextPage = () => {
    handlePageChange(page + 1, { target: "first" })
  }

  const renderEmptyState = () => (
    <div className="py-10 text-center text-muted-foreground">
      <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
      <p className="text-base font-medium">No calculations found yet</p>
      <p className="text-sm text-muted-foreground">
        Add a new calculation to see it appear in your timeline.
      </p>
    </div>
  )

  if (loading && !hasLoaded) {
    return (
      <div className="w-full space-y-4 p-3 sm:p-4">
        <Card className="border-primary/20">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative w-full space-y-4 p-1 sm:space-y-6 sm:p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent blur-3xl" />
      <div className="relative space-y-4 sm:space-y-6">
        <Card className="border-primary/15 bg-background/70 shadow-sm backdrop-blur">
          <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap gap-3">
                <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by note, date, or amount"
                    className="h-9 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <select
                    value={amountFilter}
                    onChange={(event) =>
                      setAmountFilter(event.target.value as AmountFilter)
                    }
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="all">All amounts</option>
                    <option value="positive">Positive only</option>
                    <option value="negative">Negative only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <select
                    value={selectedDate ?? ""}
                    onChange={(event) => handleDateSelect(event.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="">All dates</option>
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {formatDateKeyLabel(date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  disabled={!searchTerm && amountFilter === "all" && !selectedDate}
                >
                  Clear filters
                </Button>
              </div>
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="border-primary/15 shadow-sm">
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock className="h-4 w-4" />
                    Entries
                  </div>
                  {/* <p className="text-xs text-muted-foreground">
                    Showing {pageVisibleCount} item
                    {pageVisibleCount === 1 ? "" : "s"} on this page · Records{" "}
                    {pageRangeStart || 0}-{pageRangeEnd || 0} of {effectiveTotal}
                  </p> */}
                </div>
                <div className="flex items-center gap-2">
                  {loading && hasLoaded ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={loading || page === 0 || !filteredEntries.length}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <select
                    value={Math.min(page + 1, pageCount)}
                    onChange={(event) =>
                      handlePageChange(Math.max(0, Number(event.target.value) - 1), {
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
                  Page {Math.min(page + 1, effectivePageCount)} / {effectivePageCount}
                </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={loading || page >= effectivePageCount - 1 || !filteredEntries.length}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
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
                    {!paginatedEntries.length ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6">
                          {renderEmptyState()}
                        </td>
                      </tr>
                    ) : (
                      paginatedEntries.map((entry) => {
                        const total = getTotalAmount(entry.denominations)
                        const isActive = currentEntry?.id === entry.id
                        const dateLabel = formatDateDisplay(
                          entry.ist_timestamp || entry.created_at
                        )
                        const timeLabel = formatTimeDisplay(
                          entry.ist_timestamp || entry.created_at
                        )

                        return (
                          <tr
                            key={entry.id}
                            className={`cursor-pointer border-b transition hover:bg-muted/60 ${
                              isActive ? "bg-primary/5" : ""
                            }`}
                            onClick={() => handleRowSelect(entry.id)}
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
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {totalEntries && filteredEntries.length
                    ? `Selected: ${activeEntryPosition || 1} of ${totalEntries}`
                    : "No entry selected"}
                </span>
                <span>
                  Page {Math.min(page + 1, pageCount)} · {pageSize} rows per page
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent side="right" className="w-full sm:max-w-xl">
            {!currentEntry ? (
              renderEmptyState()
            ) : (
              <>
                <SheetHeader className="pb-2">
                  <SheetTitle className="flex flex-wrap items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    {formatDateDisplay(currentEntry.ist_timestamp || currentEntry.created_at)}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal">
                      {formatTimeDisplay(currentEntry.ist_timestamp || currentEntry.created_at)} IST
                    </span>
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-4 p-4 pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Active entry
                        </span>
                        {selectedDate ? (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            Filtered to {formatDateKeyLabel(selectedDate)}
                          </span>
                        ) : null}
                      </div>
                      {currentEntry.note ? (
                        <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                          {currentEntry.note}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No note added.</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-muted-foreground">Total value</div>
                      <div
                        className={`text-3xl font-bold ${
                          getTotalAmount(currentEntry.denominations) >= 0
                            ? "text-emerald-600"
                            : "text-destructive"
                        }`}
                      >
                        ₹{getTotalAmount(currentEntry.denominations).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigateEntry("prev")}
                          disabled={!canGoOlder || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigateEntry("next")}
                          disabled={!canGoNewer || loading}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(currentEntry.id)}
                          disabled={deletingId === currentEntry.id}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === currentEntry.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Unique denominations</p>
                      <p className="text-xl font-semibold">{uniqueDenominationsUsed}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Total notes counted</p>
                      <p className={`text-xl font-semibold ${noteCountBadge}`}>
                        {totalNotesCount}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Active position</p>
                      <p className="text-xl font-semibold">
                        {activeEntryPosition} / {filteredEntries.length}
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
                      className="overflow-x-auto"
                      style={{
                        width: "100%",
                        maxWidth: "100vw",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <style>{`
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      <table className="w-full">
                        <thead className="bg-muted/60">
                          <tr className="border-b border-border">
                            <th className="sticky left-0 z-20 w-28 border-r border-border bg-muted/70 px-3 py-2 text-left text-sm font-semibold text-muted-foreground">
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
                                className="border-b border-border transition-colors hover:bg-background"
                              >
                                <td className="sticky left-0 z-10 w-28 border-r border-border bg-muted/50 px-3 py-2">
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
                                    ₹{(denom.denomination * denom.count).toLocaleString()}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
