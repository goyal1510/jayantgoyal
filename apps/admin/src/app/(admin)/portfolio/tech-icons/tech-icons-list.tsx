"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  createPortfolioData,
  updatePortfolioData,
  deletePortfolioData,
} from "@/lib/portfolio-api";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
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

interface TechIconsListProps {
  initialData: TechIcon[];
}

type FormData = Omit<TechIcon, "id" | "created_at" | "updated_at">;

const emptyForm: FormData = {
  icon_key: "",
  name: "",
  color: "",
  sort_order: 0,
  is_visible: true,
};

export function TechIconsList({ initialData }: TechIconsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TechIcon | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      sort_order: items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: TechIcon) => {
    setEditingItem(item);
    setFormData({
      icon_key: item.icon_key,
      name: item.name,
      color: item.color ?? "",
      sort_order: item.sort_order,
      is_visible: item.is_visible,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingItem) {
        const result = await updatePortfolioData<TechIcon>("tech_icons", editingItem.id, formData);
        if (result.error) throw new Error(result.error);
        toast.success("Tech icon updated");
      } else {
        const result = await createPortfolioData<TechIcon>("tech_icons", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Tech icon added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save tech icon"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tech icon?")) return;

    setDeleting(id);

    try {
      const result = await deletePortfolioData("tech_icons", id);
      if (result.error) throw new Error(result.error);
      toast.success("Tech icon deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete tech icon"
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: TechIcon) => {
    try {
      const result = await updatePortfolioData<TechIcon>("tech_icons", item.id, { is_visible: !item.is_visible });
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_visible: !i.is_visible } : i
        )
      );
      toast.success(item.is_visible ? "Hidden from portfolio" : "Now visible");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tech Icons</CardTitle>
            <CardDescription>
              Icons representing technologies you work with.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tech Icon
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tech icons yet. Click &quot;Add Tech Icon&quot; to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: item.color || "#666" }}
                  >
                    {item.icon_key.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.icon_key}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleVisibility(item)}
                    >
                      {item.is_visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Tech Icon" : "Add Tech Icon"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the tech icon details."
                : "Add a new technology icon to your portfolio."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
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
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
