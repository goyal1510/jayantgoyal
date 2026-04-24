"use client"

import * as React from "react"
import { Card, CardContent } from "@repo/ui/card"
import { Button } from "@repo/ui/button"
import { PageSpinner } from "@/components/ui/page-spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@repo/ui/switch"
import { Activity } from "@/lib/activity-tracker/database"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

import { EditActivityDialog } from "./edit-activity-dialog"

interface ActivitiesResponse {
  activities: Activity[]
}

export default function ManagementClient() {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [updatingActivities, setUpdatingActivities] = React.useState<Set<string>>(new Set())
  const [editingActivity, setEditingActivity] = React.useState<Activity | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  const loadActivities = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/activity-tracker?include_inactive=true", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to load activities.")
      }

      const data = (await response.json()) as ActivitiesResponse
      setActivities(data.activities || [])
    } catch {
      toast.error("Unable to load activities.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const handleToggleActive = async (activityId: string, currentIsActive: boolean) => {
    if (updatingActivities.has(activityId)) return

    try {
      setUpdatingActivities((prev) => new Set(prev).add(activityId))

      const response = await fetch(`/api/activity-tracker/${activityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !currentIsActive,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update activity.")
      }

      toast.success(
        `Activity ${!currentIsActive ? "activated" : "deactivated"} successfully!`
      )

      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? { ...activity, is_active: !currentIsActive }
            : activity
        )
      )
    } catch {
      toast.error("Unable to update activity.")
    } finally {
      setUpdatingActivities((prev) => {
        const newSet = new Set(prev)
        newSet.delete(activityId)
        return newSet
      })
    }
  }

  const handleOpenEditDialog = (activity: Activity) => {
    setEditingActivity(activity)
    setIsEditDialogOpen(true)
  }

  const handleActivitySaved = (updatedActivity: Activity) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-lg font-bold tracking-tight sm:text-2xl md:text-3xl">Management</h1>
        <PageSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1 className="text-lg font-bold tracking-tight sm:text-2xl md:text-3xl">Management</h1>
      <Card>
        <CardContent className="p-4 sm:p-6">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                No activities yet. Create activities using the &ldquo;Add Activity&rdquo; button on the Dashboard page.
              </p>
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="rounded-md border sm:rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px] sm:w-[200px]">Activity</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium text-sm">{activity.name}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                activity.is_active
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {activity.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 sm:gap-4">
                              <Switch
                                checked={activity.is_active}
                                onCheckedChange={() =>
                                  handleToggleActive(activity.id, activity.is_active)
                                }
                                disabled={updatingActivities.has(activity.id)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(activity)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditActivityDialog
        activity={editingActivity}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={handleActivitySaved}
      />
    </div>
  )
}
