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
  note: "",
  sort_order: 0,
  is_visible: true,
};

export function NavigationDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NavItem | null;
  formData: NavFormData;
  setFormData: (data: NavFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Navigation Item</DialogTitle>
          <DialogDescription>
            Section IDs are fixed to real Portfolio sections; edit only the
            public label, mobile note, order, and visibility.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Input value={`#${formData.section_id}`} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(event) =>
                  setFormData({ ...formData, label: event.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Mobile Menu Note</Label>
              <Input
                id="note"
                value={formData.note ?? ""}
                onChange={(event) =>
                  setFormData({ ...formData, note: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Display Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    sort_order: Number(event.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_visible"
                checked={formData.is_visible}
                onCheckedChange={(is_visible) =>
                  setFormData({ ...formData, is_visible })
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
            <Button type="submit" disabled={!editing || saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Update Navigation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
