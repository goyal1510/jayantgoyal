"use client"

import * as React from "react"
import { ActivityStats } from "@/components/activity-stats"
import { MonthNavigator } from "@/components/month-navigator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentMonth, getPreviousMonth, getNextMonth } from "@/lib/utils/date"
import { Plus } from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = React.useState<string>(getCurrentMonth())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [newActivityName, setNewActivityName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth))
  }

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth))
  }

  const handleCreateActivity = async () => {
    if (!newActivityName.trim()) {
      toast.error("Activity name is required.")
      return
    }

    try {
      setIsCreating(true)

      const response = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newActivityName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create activity.")
      }

      toast.success("Activity created successfully!")
      setNewActivityName("")
      setIsCreateDialogOpen(false)
      setRefreshKey((prev) => prev + 1) // Trigger re-render of ActivityStats
    } catch {
      toast.error("Unable to create activity.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4">
          <MonthNavigator
            currentMonth={currentMonth}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Activity</DialogTitle>
                <DialogDescription>
                  Add a new activity to track. This activity will be available for all months.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="activity-name">Activity Name</Label>
                  <Input
                    id="activity-name"
                    placeholder="e.g., Exercise, Reading, Meditation"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCreating) {
                        handleCreateActivity()
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateActivity} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ActivityStats key={refreshKey} currentMonth={currentMonth} />
    </div>
  )
}
