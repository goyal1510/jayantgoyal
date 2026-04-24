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
import type { Education } from "@/lib/types";
import { EducationDialog, emptyEducationForm, type EducationFormData } from "./education-dialog";

interface EducationListProps {
  initialData: Education[];
}

export function EducationList({ initialData }: EducationListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Education | null>(null);
  const [formData, setFormData] = useState<EducationFormData>(emptyEducationForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyEducationForm,
      sort_order: items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Education) => {
    setEditingItem(item);
    setFormData({
      school: item.school,
      degree: item.degree,
      period: item.period,
      location: item.location ?? "",
      detail: item.detail ?? "",
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
        const result = await updatePortfolioData<Education>(
          "education",
          editingItem.id,
          formData
        );
        if (result.error) throw new Error(result.error);
        toast.success("Education updated");
      } else {
        const result = await createPortfolioData<Education>("education", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Education added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save education"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setDeleting(id);

    try {
      const result = await deletePortfolioData("education", id);
      if (result.error) throw new Error(result.error);
      toast.success("Education deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete education"
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: Education) => {
    try {
      const result = await updatePortfolioData<Education>("education", item.id, {
        is_visible: !item.is_visible,
      });
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
            <CardTitle>Education Entries</CardTitle>
            <CardDescription>
              Add and manage your educational background.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Education
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No education entries yet. Click &quot;Add Education&quot; to get
              started.
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.school}</h3>
                      {!item.is_visible && (
                        <span className="text-xs text-muted-foreground">
                          (Hidden)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.degree} • {item.period}
                    </p>
                    {item.location && (
                      <p className="text-sm text-muted-foreground">
                        {item.location}
                      </p>
                    )}
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

      <EducationDialog
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
