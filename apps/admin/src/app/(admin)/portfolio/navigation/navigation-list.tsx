"use client";

import { useState } from "react";
import { Eye, EyeOff, GripVertical, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";

import { updatePortfolioData } from "@/lib/portfolio-api";
import type { NavItem } from "@/lib/types";

import {
  emptyNavForm,
  NavigationDialog,
  type NavFormData,
} from "./navigation-dialog";

export function NavigationList({ initialData }: { initialData: NavItem[] }) {
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [formData, setFormData] = useState<NavFormData>(emptyNavForm);
  const [saving, setSaving] = useState(false);

  function edit(item: NavItem) {
    setEditingItem(item);
    setFormData({
      section_id: item.section_id,
      label: item.label,
      note: item.note ?? "",
      sort_order: item.sort_order,
      is_visible: item.is_visible,
    });
    setDialogOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    try {
      const result = await updatePortfolioData<NavItem>(
        "nav_items",
        editingItem.id,
        formData,
      );
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Navigation update failed");
      }
      setItems((current) =>
        current
          .map((item) => (item.id === editingItem.id ? result.data! : item))
          .sort((a, b) => a.sort_order - b.sort_order),
      );
      setDialogOpen(false);
      toast.success("Navigation updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Navigation update failed",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(item: NavItem) {
    const result = await updatePortfolioData<NavItem>("nav_items", item.id, {
      is_visible: !item.is_visible,
    });
    if (result.error || !result.data) {
      toast.error(result.error ?? "Visibility update failed");
      return;
    }
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? result.data! : candidate,
      ),
    );
    toast.success(
      item.is_visible ? "Hidden from navigation" : "Visible in navigation",
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Navigation Items</CardTitle>
          <CardDescription>
            Navigation is limited to sections that exist in the redesigned
            Portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {!item.is_visible ? (
                    <span className="text-xs text-muted-foreground">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  #{item.section_id} · {item.note || "No mobile note"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void toggleVisibility(item)}
              >
                {item.is_visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => edit(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <NavigationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={save}
        saving={saving}
      />
    </>
  );
}
