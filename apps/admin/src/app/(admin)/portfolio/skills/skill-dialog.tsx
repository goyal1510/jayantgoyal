"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Switch } from "@repo/ui/switch";
import type { Skill } from "@/lib/types";

export type SkillFormData = Omit<Skill, "id" | "created_at" | "updated_at">;

export const emptySkillForm: SkillFormData = {
  category_id: "",
  name: "",
  level: null,
  sort_order: 0,
  is_visible: true,
};

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Skill | null;
  formData: SkillFormData;
  setFormData: (data: SkillFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function SkillDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: SkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Skill" : "Add Skill"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the skill details."
              : "Add a new skill to this category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="React"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill-level">Level (0-100)</Label>
                <Input
                  id="skill-level"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.level ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="85"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill-sort">Sort Order</Label>
                <Input
                  id="skill-sort"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="skill-visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible: checked })
                }
              />
              <Label htmlFor="skill-visible">Visible on portfolio</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
