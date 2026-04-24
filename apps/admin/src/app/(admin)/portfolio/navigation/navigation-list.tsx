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
import type { NavItem } from "@/lib/types";
import { NavigationDialog, emptyNavForm, type NavFormData } from "./navigation-dialog";

interface NavigationListProps {
  initialData: NavItem[];
}

export function NavigationList({ initialData }: NavigationListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [formData, setFormData] = useState<NavFormData>(emptyNavForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyNavForm,
      sort_order: items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: NavItem) => {
    setEditingItem(item);
    setFormData({
      section_id: item.section_id,
      label: item.label,
      icon_key: item.icon_key,
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
        const result = await updatePortfolioData<NavItem>("nav_items", editingItem.id, formData);
        if (result.error) throw new Error(result.error);
        toast.success("Nav item updated");
      } else {
        const result = await createPortfolioData<NavItem>("nav_items", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Nav item added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save nav item"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this nav item?")) return;

    setDeleting(id);

    try {
      const result = await deletePortfolioData("nav_items", id);
      if (result.error) throw new Error(result.error);
      toast.success("Nav item deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete nav item"
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: NavItem) => {
    try {
      const result = await updatePortfolioData<NavItem>("nav_items", item.id, { is_visible: !item.is_visible });
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_visible: !i.is_visible } : i
        )
      );
      toast.success(item.is_visible ? "Hidden from nav" : "Now visible");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Navigation Items</CardTitle>
            <CardDescription>
              Configure the navigation menu for your portfolio.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Nav Item
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No navigation items yet. Click &quot;Add Nav Item&quot; to get
              started.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: item.color
                        ? `${item.color}20`
                        : "hsl(var(--muted))",
                      color: item.color || "hsl(var(--muted-foreground))",
                    }}
                  >
                    <span className="text-xs font-bold">
                      {item.icon_key.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {!item.is_visible && (
                        <span className="text-xs text-muted-foreground">
                          (Hidden)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Section: #{item.section_id} • Icon: {item.icon_key}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
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
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
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

      <NavigationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </>
  );
}
