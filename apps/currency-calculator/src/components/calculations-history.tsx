"use client"

import * as React from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Trash2,
} from "lucide-react"

import { deleteCalculation, getCalculations } from "@/lib/api/client-calculations"
import type { CalculationWithDenominations } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CalculationsHistory() {
  const [entries, setEntries] = React.useState<CalculationWithDenominations[]>(
    []
  )
  const [availableDates, setAvailableDates] = React.useState<string[]>([])
  const [currentEntryIndex, setCurrentEntryIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

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

  const getDateKey = (timestamp: string | null) => {
    if (!timestamp) return null
    const date = parseISTTimestamp(timestamp)
    if (!date) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const loadCalculations = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCalculations()
      const sortedEntries = [...data].sort((a, b) => {
        const aDate =
          parseISTTimestamp(a.ist_timestamp || a.created_at || "")?.getTime() ??
          0
        const bDate =
          parseISTTimestamp(b.ist_timestamp || b.created_at || "")?.getTime() ??
          0
        return bDate - aDate
      })

      const dateSet = new Set<string>()
      sortedEntries.forEach((entry) => {
        const key =
          getDateKey(entry.ist_timestamp || entry.created_at) ??
          entry.created_at ??
          ""
        if (key) dateSet.add(key)
      })

      setEntries(sortedEntries)
      setAvailableDates(Array.from(dateSet).sort((a, b) => (a < b ? 1 : -1)))
      setCurrentEntryIndex(0)
    } catch (error) {
      console.error("Error loading calculations:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadCalculations()
  }, [loadCalculations])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation?")) return
    try {
      setDeletingId(id)
      await deleteCalculation(id)
      await loadCalculations()
    } catch (error) {
      console.error("Error deleting calculation:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const getTotalAmount = (denominations: { denomination: number; count: number }[]) =>
    denominations.reduce((total, denom) => total + denom.denomination * denom.count, 0)

  const navigateEntry = (direction: "prev" | "next") => {
    if (direction === "prev" && currentEntryIndex < entries.length - 1) {
      setCurrentEntryIndex((prev) => prev + 1)
    } else if (direction === "next" && currentEntryIndex > 0) {
      setCurrentEntryIndex((prev) => prev - 1)
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

  const handleDateSelect = (value: string) => {
    if (!value) return
    const entryIndex = entries.findIndex((entry) => {
      const key =
        getDateKey(entry.ist_timestamp || entry.created_at) ??
        entry.created_at ??
        ""
      return key === value
    })
    if (entryIndex !== -1) {
      setCurrentEntryIndex(entryIndex)
    }
  }

  const currentEntry = entries[currentEntryIndex]

  if (loading) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p>Loading calculations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2 p-1 sm:space-y-4 sm:p-4">
      <Card className="shadow-sm">
        <CardContent className="p-2 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-muted p-1 sm:flex-row sm:gap-4 sm:p-3">
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateEntry("prev")}
                  disabled={currentEntryIndex === entries.length - 1}
                  className="flex h-10 min-h-[40px] w-10 items-center justify-center touch-manipulation sm:h-9 sm:w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                  <Calendar className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {currentEntry
                        ? formatDateDisplay(
                            currentEntry.ist_timestamp || currentEntry.created_at
                          )
                        : "No date"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentEntry
                        ? formatTimeDisplay(
                            currentEntry.ist_timestamp || currentEntry.created_at
                          )
                        : "No time"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateEntry("next")}
                  disabled={currentEntryIndex === 0}
                  className="flex h-10 min-h-[40px] w-10 items-center justify-center touch-manipulation sm:h-9 sm:w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="w-full sm:w-auto">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Jump to date
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={
                      currentEntry
                        ? getDateKey(
                            currentEntry.ist_timestamp || currentEntry.created_at
                          ) ?? ""
                        : ""
                    }
                    onChange={(event) => handleDateSelect(event.target.value)}
                  >
                    {!availableDates.length ? (
                      <option value="">No dates</option>
                    ) : null}
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {formatDateKeyLabel(date)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {!currentEntry ? (
              <div className="py-6 text-center text-muted-foreground sm:py-8">
                <History className="mx-auto mb-3 h-10 w-10 opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
                <p className="text-sm sm:text-base">No calculations found.</p>
              </div>
            ) : (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                      <div className="flex-1">
                        {currentEntry.note ? (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Note
                            </Label>
                            <Input
                              value={currentEntry.note}
                              readOnly
                              className="mt-1 h-10 min-h-[40px] text-base sm:h-8 sm:text-sm"
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="text-center sm:text-right">
                        <p
                          className={`flex h-10 items-center justify-center text-base font-bold sm:h-8 sm:justify-end ${
                            getTotalAmount(currentEntry.denominations) >= 0
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          ₹{getTotalAmount(currentEntry.denominations).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted p-1 sm:p-3">
                      <h4 className="mb-1 text-center text-sm font-semibold text-muted-foreground sm:mb-3">
                        Denomination Details
                      </h4>
                      <div
                        className="overflow-x-auto"
                        style={{
                          width: "100%",
                          maxWidth: "100vw",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        <style jsx>{`
                          div::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                        <table className="w-full">
                          <thead className="sticky top-0 z-10 bg-muted">
                            <tr className="border-b border-border">
                              <th className="sticky left-0 z-20 w-24 border-r border-border bg-muted px-3 py-2 text-left text-sm font-semibold text-muted-foreground">
                                Denomination
                              </th>
                              <th className="w-20 px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                                Count
                              </th>
                              <th className="w-24 px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
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
                                  className="border-b border-border transition-colors hover:bg-muted"
                                >
                                  <td className="sticky left-0 z-10 w-24 border-r border-border bg-muted px-3 py-2">
                                    <div className="text-base font-semibold text-foreground">
                                      ₹{denom.denomination}
                                    </div>
                                  </td>
                                  <td className="w-20 px-3 py-2 text-center">
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
                                  <td className="w-24 px-3 py-2 text-center">
                                    <div
                                      className={`text-base font-semibold ${
                                        denom.total && denom.total >= 0
                                          ? "text-green-600"
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

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(currentEntry.id)}
                        disabled={deletingId === currentEntry.id}
                        className="flex items-center gap-1 px-3 text-sm sm:px-4"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        {deletingId === currentEntry.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
