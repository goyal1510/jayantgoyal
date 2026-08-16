"use client";

import * as React from "react";
import { ActivityStats } from "@/components/activity-tracker/activity-stats";
import { MonthNavigator } from "@/components/activity-tracker/month-navigator";
import { Button } from "@jayant/web-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@jayant/web-ui/dialog";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import {
  getCurrentMonth,
  getPreviousMonth,
  getNextMonth,
} from "@/lib/activity-tracker/date";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceHeader } from "@jayant/web-ui/workspace-header";

export default function DashboardClient() {
  const [currentMonth, setCurrentMonth] =
    React.useState<string>(getCurrentMonth());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [newActivityName, setNewActivityName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const handleCreateActivity = async () => {
    const activityName = newActivityName.trim();
    if (!activityName) {
      toast.error("Activity name is required.");
      return;
    }

    try {
      setIsCreating(true);
      setNewActivityName("");
      setIsCreateDialogOpen(false);

      const response = await fetch("/api/activity-tracker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: activityName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create activity.");
      }

      toast.success("Activity created successfully!");
      setRefreshKey((prev) => prev + 1); // Trigger re-render of ActivityStats
    } catch {
      setNewActivityName(activityName);
      setIsCreateDialogOpen(true);
      toast.error("Unable to create activity.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <WorkspaceHeader
        icon={Target}
        title="Activity overview"
        description="See monthly consistency, compare completion rates, and add the next routine you want to build."
        tone="sage"
        actions={
          <>
            <MonthNavigator
              currentMonth={currentMonth}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
            />
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl bg-[#211512] px-5 text-[#fff8ef] shadow-none hover:bg-[#211512]/90 dark:bg-[#fff8ef] dark:text-[#211512] dark:hover:bg-[#fff8ef]/90">
                  <Plus className="h-4 w-4" />
                  <span>Add activity</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Activity</DialogTitle>
                  <DialogDescription>
                    Add a new activity to track. This activity will be available
                    for all months.
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
                          handleCreateActivity();
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
          </>
        }
      />
      <ActivityStats key={refreshKey} currentMonth={currentMonth} />
    </div>
  );
}
