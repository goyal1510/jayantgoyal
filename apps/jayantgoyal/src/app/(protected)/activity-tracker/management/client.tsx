"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity } from "@/lib/activity-tracker/database"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface ActivitiesResponse {
  activities: Activity[]
}

export default function ManagementClient() {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [updatingActivities, setUpdatingActivities] = React.useState<Set<string>>(new Set())
  const [editingActivity, setEditingActivity] = React.useState<Activity | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editName, setEditName] = React.useState("")
  const [editIsActive, setEditIsActive] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

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

      // Update local state
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
    setEditName(activity.name)
    setEditIsActive(activity.is_active)
    setIsEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingActivity(null)
    setEditName("")
    setEditIsActive(true)
  }

  const handleSaveEdit = async () => {
    if (!editingActivity) return

    if (!editName.trim()) {
      toast.error("Activity name is required.")
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch(`/api/activity-tracker/${editingActivity.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          is_active: editIsActive,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update activity.")
      }

      const { activity: updatedActivity } = (await response.json()) as {
        activity: Activity
      }

      toast.success("Activity updated successfully!")

      // Update local state
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === editingActivity.id ? updatedActivity : activity
        )
      )

      handleCloseEditDialog()
    } catch {
      toast.error("Unable to update activity.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-lg font-bold tracking-tight sm:text-2xl md:text-3xl">Management</h1>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update the activity name and status. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-activity-name">Activity Name</Label>
              <Input
                id="edit-activity-name"
                placeholder="e.g., Exercise, Reading, Meditation"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSaving) {
                    handleSaveEdit()
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="edit-activity-status" className="flex-1">
                Status
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {editIsActive ? "Active" : "Inactive"}
                </span>
                <Switch
                  id="edit-activity-status"
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseEditDialog}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
