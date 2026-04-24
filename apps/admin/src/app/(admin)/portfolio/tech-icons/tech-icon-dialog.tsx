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
import type { TechIcon } from "@/lib/types";

export type TechIconFormData = Omit<TechIcon, "id" | "created_at" | "updated_at">;

export const emptyTechIconForm: TechIconFormData = {
  icon_key: "",
  name: "",
  color: "",
  sort_order: 0,
  is_visible: true,
};

interface TechIconDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TechIcon | null;
  formData: TechIconFormData;
  setFormData: (data: TechIconFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function TechIconDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: TechIconDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Tech Icon" : "Add Tech Icon"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the tech icon details."
              : "Add a new technology icon to your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="React"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon_key">Icon Key</Label>
              <Input
                id="icon_key"
                value={formData.icon_key}
                onChange={(e) =>
                  setFormData({ ...formData, icon_key: e.target.value })
                }
                placeholder="react"
                required
              />
              <p className="text-xs text-muted-foreground">
                The key used to map to an icon component (e.g., &quot;react&quot;,
                &quot;typescript&quot;, &quot;nodejs&quot;)
              </p>
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
                  placeholder="#61DAFB"
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
              <Label htmlFor="is_visible">Visible on portfolio</Label>
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
