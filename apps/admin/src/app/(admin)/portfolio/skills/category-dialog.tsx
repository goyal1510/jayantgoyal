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
import type { SkillCategory } from "@/lib/types";

export type CategoryFormData = Omit<SkillCategory, "id" | "created_at" | "updated_at">;

export const emptyCategoryForm: CategoryFormData = {
  title: "",
  icon_key: "",
  color: "",
  sort_order: 0,
  is_visible: true,
};

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SkillCategory | null;
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Category" : "Add Category"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the skill category details."
              : "Add a new skill category to organize your skills."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-title">Title</Label>
              <Input
                id="cat-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Frontend Development"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icon Key</Label>
                <Input
                  id="cat-icon"
                  value={formData.icon_key}
                  onChange={(e) =>
                    setFormData({ ...formData, icon_key: e.target.value })
                  }
                  placeholder="Code2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-color">Color</Label>
                <Input
                  id="cat-color"
                  value={formData.color ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-sort">Sort Order</Label>
              <Input
                id="cat-sort"
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
            <div className="flex items-center space-x-2">
              <Switch
                id="cat-visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible: checked })
                }
              />
              <Label htmlFor="cat-visible">Visible on portfolio</Label>
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
