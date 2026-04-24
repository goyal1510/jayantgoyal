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
import type { NavItem } from "@/lib/types";

export type NavFormData = Omit<NavItem, "id" | "created_at" | "updated_at">;

export const emptyNavForm: NavFormData = {
  section_id: "",
  label: "",
  icon_key: "",
  color: "",
  sort_order: 0,
  is_visible: true,
};

interface NavigationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NavItem | null;
  formData: NavFormData;
  setFormData: (data: NavFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function NavigationDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: NavigationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Nav Item" : "Add Nav Item"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the navigation item details."
              : "Add a new navigation item to your portfolio menu."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                placeholder="About Me"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_id">Section ID</Label>
              <Input
                id="section_id"
                value={formData.section_id}
                onChange={(e) =>
                  setFormData({ ...formData, section_id: e.target.value })
                }
                placeholder="about"
                required
              />
              <p className="text-xs text-muted-foreground">
                The HTML id of the section this links to (e.g., &quot;about&quot;,
                &quot;experience&quot;)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon_key">Icon Key</Label>
                <Input
                  id="icon_key"
                  value={formData.icon_key}
                  onChange={(e) =>
                    setFormData({ ...formData, icon_key: e.target.value })
                  }
                  placeholder="User"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    value={formData.color ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                  />
                  <input
                    type="color"
                    value={formData.color || "#666666"}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
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
                id="is_visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible: checked })
                }
              />
              <Label htmlFor="is_visible">Visible in navigation</Label>
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
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
