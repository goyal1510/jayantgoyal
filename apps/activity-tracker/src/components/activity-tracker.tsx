"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Activity, ActivityEntry } from "@/lib/types/database"
import {
  getDaysInMonth,
  isDateEditable,
  isFutureDate,
} from "@/lib/utils/date"
import { toast } from "sonner"

interface ActivitiesResponse {
  activities: Activity[]
}

interface EntriesResponse {
  entries: ActivityEntry[]
}

/**
 * Format a Date object to YYYY-MM-DD using local time (not UTC)
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Get the last 3 editable dates (today, yesterday, day before yesterday)
 * Uses local time, not UTC
 */
function getEditableDates(): string[] {
  const dates: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(formatDateLocal(date))
  }
  
  return dates
}

interface ActivityTrackerProps {
  currentMonth: string
}

export function ActivityTracker({ currentMonth }: ActivityTrackerProps) {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [entries, setEntries] = React.useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [updatingEntries, setUpdatingEntries] = React.useState<Set<string>>(new Set())

  const editableDates = React.useMemo(() => getEditableDates(), [])
  const allDaysInMonth = React.useMemo(
    () => getDaysInMonth(currentMonth),
    [currentMonth]
  )

  const loadData = React.useCallback(
    async (month: string) => {
      try {
        setIsLoading(true)

        // Load activities filtered by month
        const activitiesResponse = await fetch(`/api/activities?month=${month}`, {
          cache: "no-store",
        })

        if (!activitiesResponse.ok) {
          throw new Error("Failed to load activities.")
        }

        const activitiesData = (await activitiesResponse.json()) as ActivitiesResponse

        // Load entries for the entire month
        const entriesResponse = await fetch(`/api/activities/entries?month=${month}`, {
          cache: "no-store",
        })

        if (!entriesResponse.ok) {
          throw new Error("Failed to load entries.")
        }

        const entriesData = (await entriesResponse.json()) as EntriesResponse

        setActivities(activitiesData.activities || [])
        setEntries(entriesData.entries || [])
      } catch {
        toast.error("Unable to load activity data.")
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  React.useEffect(() => {
    void loadData(currentMonth)
  }, [currentMonth, loadData])

  const handleToggleEntry = async (
    activityId: string,
    date: string,
    currentCompleted: boolean
  ) => {
    if (!isDateEditable(date)) {
      toast.error("You can only update entries for today, yesterday, or the day before yesterday.")
      return
    }

    const entryKey = `${activityId}-${date}`
    if (updatingEntries.has(entryKey)) return

    try {
      setUpdatingEntries((prev) => new Set(prev).add(entryKey))

      const response = await fetch("/api/activities/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity_id: activityId,
          date,
          completed: !currentCompleted,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update entry.")
      }

      const { entry } = (await response.json()) as { entry: ActivityEntry }

      // Update local state
      setEntries((prev) => {
        const existingIndex = prev.findIndex(
          (e) => e.activity_id === activityId && e.date === date
        )

        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = entry
          return updated
        } else {
          return [...prev, entry]
        }
      })
    } catch {
      toast.error("Unable to update activity entry.")
    } finally {
      setUpdatingEntries((prev) => {
        const newSet = new Set(prev)
        newSet.delete(entryKey)
        return newSet
      })
    }
  }


  const isEntryCompleted = (activityId: string, date: string): boolean => {
    const entry = entries.find(
      (e) => e.activity_id === activityId && e.date === date && e.completed
    )
    return Boolean(entry)
  }

  const isUpdating = (activityId: string, date: string): boolean => {
    return updatingEntries.has(`${activityId}-${date}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No activities yet. Create your first activity to start tracking!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">
                      Activity
                    </TableHead>
                    {allDaysInMonth.map((date) => {
                      const dayNumber = parseInt(date.split("-")[2])
                      const isEditable = isDateEditable(date)
                      
                      // Calculate completion percentage for this date (only for past/present dates)
                      const isFuture = isFutureDate(date)
                      let bgColor = ""
                      
                      if (!isFuture) {
                        const completedCount = activities.filter((activity) =>
                          isEntryCompleted(activity.id, date)
                        ).length
                        const totalActivities = activities.length
                        const completionPercentage =
                          totalActivities > 0
                            ? (completedCount / totalActivities) * 100
                            : 0

                        // Determine background color based on completion percentage
                        if (completionPercentage < 50) {
                          bgColor = "bg-red-100 dark:bg-red-950/50"
                        } else if (completionPercentage >= 50 && completionPercentage <= 80) {
                          bgColor = "bg-yellow-100 dark:bg-yellow-700/50"
                        } else if (completionPercentage > 80) {
                          bgColor = "bg-green-100 dark:bg-green-900/40"
                        }
                      }

                      return (
                        <TableHead
                          key={date}
                          className={`text-center p-1 w-[32px] ${
                            isEditable ? "bg-muted/50" : ""
                          } ${bgColor}`}
                          title={isEditable ? "Editable" : "Read-only"}
                        >
                          <span className="text-xs font-semibold">{dayNumber}</span>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => {
                    const completedCount = entries.filter(
                      (e) => e.activity_id === activity.id && e.completed
                    ).length

                    return (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium p-2">
                          {activity.name}
                        </TableCell>
                        {allDaysInMonth.map((date) => {
                          const isCompleted = isEntryCompleted(activity.id, date)
                          const isUpdatingEntry = isUpdating(activity.id, date)
                          const canEdit = isDateEditable(date)

                          // Calculate completion percentage for this date column (only for past/present dates)
                          const isFuture = isFutureDate(date)
                          let bgColor = ""
                          
                          if (!isFuture) {
                            const completedCount = activities.filter((a) =>
                              isEntryCompleted(a.id, date)
                            ).length
                            const totalActivities = activities.length
                            const completionPercentage =
                              totalActivities > 0
                                ? (completedCount / totalActivities) * 100
                                : 0

                            // Determine background color based on completion percentage
                            if (completionPercentage < 50) {
                              bgColor = "bg-red-100 dark:bg-red-950/50"
                            } else if (completionPercentage >= 50 && completionPercentage <= 80) {
                              bgColor = "bg-yellow-100 dark:bg-yellow-700/50"
                            } else {
                              bgColor = "bg-green-100 dark:bg-green-900/40"
                            }
                          }

                          return (
                            <TableCell
                              key={date}
                              className={`text-center p-1 ${bgColor}`}
                            >
                              <Checkbox
                                checked={isCompleted}
                                disabled={isUpdatingEntry || !canEdit}
                                onCheckedChange={() =>
                                  handleToggleEntry(activity.id, date, isCompleted)
                                }
                                className="h-4 w-4"
                              />
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                  {/* Summary Row */}
                  {activities.length > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-medium p-2">
                        Summary
                      </TableCell>
                      {allDaysInMonth.map((date) => {
                        const completedCount = activities.filter((activity) =>
                          isEntryCompleted(activity.id, date)
                        ).length
                        const totalActivities = activities.length
                        
                        // Only apply color coding for past/present dates
                        const isFuture = isFutureDate(date)
                        let bgColor = ""
                        
                        if (!isFuture) {
                          const completionPercentage =
                            totalActivities > 0
                              ? (completedCount / totalActivities) * 100
                              : 0

                          if (completionPercentage < 50) {
                            bgColor = "bg-red-100 dark:bg-red-950/50"
                          } else if (completionPercentage >= 50 && completionPercentage <= 80) {
                            bgColor = "bg-yellow-100 dark:bg-yellow-700/50"
                          } else {
                            bgColor = "bg-green-100 dark:bg-green-900/40"
                          }
                        }

                        return (
                          <TableCell
                            key={date}
                            className={`text-center p-1 ${bgColor}`}
                          >
                            <span className="text-xs font-semibold">
                              {completedCount}/{totalActivities}
                            </span>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
