"use client";

import * as React from "react";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayantgoyal/web-ui/dialog";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";
import { Switch } from "@jayantgoyal/web-ui/switch";
import { Activity } from "@/lib/activity-tracker/database";
import { toast } from "sonner";

interface EditActivityDialogProps {
  activity: Activity | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Activity) => void;
}

export function EditActivityDialog({
  activity,
  isOpen,
  onOpenChange,
  onSaved,
}: EditActivityDialogProps) {
  const [editName, setEditName] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (activity) {
      setEditName(activity.name);
      setEditIsActive(activity.is_active);
    }
  }, [activity]);

  const handleClose = () => {
    onOpenChange(false);
    setEditName("");
    setEditIsActive(true);
  };

  const handleSave = async () => {
    if (!activity) return;

    if (!editName.trim()) {
      toast.error("Activity name is required.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`/api/activity-tracker/${activity.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          is_active: editIsActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update activity.");
      }

      const { activity: updatedActivity } = (await response.json()) as {
        activity: Activity;
      };

      toast.success("Activity updated successfully!");
      onSaved(updatedActivity);
      handleClose();
    } catch {
      toast.error("Unable to update activity.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Update the activity name and status. Changes will be reflected
            immediately.
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
                  handleSave();
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
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
