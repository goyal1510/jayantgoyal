"use client";

import * as React from "react";
import { Checkbox } from "@repo/ui/checkbox";
import { PageSpinner } from "@repo/ui/page-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import { Activity, ActivityEntry } from "@/lib/activity-tracker/database";
import {
  getDaysInMonth,
  isDateEditable,
  isFutureDate,
} from "@/lib/activity-tracker/date";
import { toast } from "sonner";
import { getCompletionBgColor } from "./completion-color";
import { CalendarDays } from "lucide-react";

interface ActivitiesResponse {
  activities: Activity[];
}

interface EntriesResponse {
  entries: ActivityEntry[];
}

interface ActivityTrackerProps {
  currentMonth: string;
}

export function ActivityTracker({ currentMonth }: ActivityTrackerProps) {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingEntries, setUpdatingEntries] = React.useState<Set<string>>(
    new Set(),
  );

  const allDaysInMonth = React.useMemo(
    () => getDaysInMonth(currentMonth),
    [currentMonth],
  );

  const loadData = React.useCallback(async (month: string) => {
    try {
      setIsLoading(true);

      const activitiesResponse = await fetch(
        `/api/activity-tracker?month=${month}`,
        {
          cache: "no-store",
        },
      );

      if (!activitiesResponse.ok) {
        throw new Error("Failed to load activities.");
      }

      const activitiesData =
        (await activitiesResponse.json()) as ActivitiesResponse;

      const entriesResponse = await fetch(
        `/api/activity-tracker/entries?month=${month}`,
        {
          cache: "no-store",
        },
      );

      if (!entriesResponse.ok) {
        throw new Error("Failed to load entries.");
      }

      const entriesData = (await entriesResponse.json()) as EntriesResponse;

      setActivities(activitiesData.activities || []);
      setEntries(entriesData.entries || []);
    } catch {
      toast.error("Unable to load activity data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData(currentMonth);
  }, [currentMonth, loadData]);

  const handleToggleEntry = async (
    activityId: string,
    date: string,
    currentCompleted: boolean,
  ) => {
    if (!isDateEditable(date)) {
      toast.error(
        "You can only update entries for today, yesterday, or the day before yesterday.",
      );
      return;
    }

    const entryKey = `${activityId}-${date}`;
    if (updatingEntries.has(entryKey)) return;

    try {
      setUpdatingEntries((prev) => new Set(prev).add(entryKey));

      const response = await fetch("/api/activity-tracker/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity_id: activityId,
          date,
          completed: !currentCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update entry.");
      }

      const { entry } = (await response.json()) as { entry: ActivityEntry };

      setEntries((prev) => {
        const existingIndex = prev.findIndex(
          (e) => e.activity_id === activityId && e.date === date,
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = entry;
          return updated;
        } else {
          return [...prev, entry];
        }
      });
    } catch {
      toast.error("Unable to update activity entry.");
    } finally {
      setUpdatingEntries((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entryKey);
        return newSet;
      });
    }
  };

  const isEntryCompleted = (activityId: string, date: string): boolean => {
    const entry = entries.find(
      (e) => e.activity_id === activityId && e.date === date && e.completed,
    );
    return Boolean(entry);
  };

  const isUpdating = (activityId: string, date: string): boolean => {
    return updatingEntries.has(`${activityId}-${date}`);
  };

  const getDateBgColor = (date: string): string => {
    if (isFutureDate(date)) return "";
    const completedCount = activities.filter((a) =>
      isEntryCompleted(a.id, date),
    ).length;
    return getCompletionBgColor(completedCount, activities.length);
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <section className="rounded-[1.75rem] border border-border/80 bg-card">
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <p className="text-muted-foreground mb-4">
              No activities yet. Create your first activity to start tracking!
            </p>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card">
          <div className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.035em]">
                <CalendarDays className="size-5" />
                Daily check-ins
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Highlighted columns are currently editable.
              </p>
            </div>
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.66rem] uppercase tracking-[0.13em] text-muted-foreground">
              {activities.length}{" "}
              {activities.length === 1 ? "routine" : "routines"}
            </p>
          </div>
          <div className="overflow-x-auto p-4 sm:p-6">
            <div className="min-w-max overflow-hidden rounded-xl border border-border/80">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Activity</TableHead>
                    {allDaysInMonth.map((date) => {
                      const dayNumber = parseInt(date.split("-")[2]!);
                      const isEditable = isDateEditable(date);

                      return (
                        <TableHead
                          key={date}
                          className={`text-center p-1 w-[32px] ${
                            isEditable ? "bg-muted/50" : ""
                          } ${getDateBgColor(date)}`}
                          title={isEditable ? "Editable" : "Read-only"}
                        >
                          <span className="text-xs font-semibold">
                            {dayNumber}
                          </span>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium p-2">
                        {activity.name}
                      </TableCell>
                      {allDaysInMonth.map((date) => {
                        const isCompleted = isEntryCompleted(activity.id, date);
                        const isUpdatingEntry = isUpdating(activity.id, date);
                        const canEdit = isDateEditable(date);

                        return (
                          <TableCell
                            key={date}
                            className={`text-center p-1 ${getDateBgColor(date)}`}
                          >
                            <Checkbox
                              checked={isCompleted}
                              disabled={isUpdatingEntry || !canEdit}
                              onCheckedChange={() =>
                                handleToggleEntry(
                                  activity.id,
                                  date,
                                  isCompleted,
                                )
                              }
                              className="h-4 w-4"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {activities.length > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-medium p-2">Summary</TableCell>
                      {allDaysInMonth.map((date) => {
                        const completedCount = activities.filter((activity) =>
                          isEntryCompleted(activity.id, date),
                        ).length;

                        return (
                          <TableCell
                            key={date}
                            className={`text-center p-1 ${getDateBgColor(date)}`}
                          >
                            <span className="text-xs font-semibold">
                              {completedCount}/{activities.length}
                            </span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
