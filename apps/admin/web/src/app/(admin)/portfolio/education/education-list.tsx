"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@jayantgoyal/web-ui/button";
import { ConfirmationDialog } from "@jayantgoyal/web-ui/confirmation-dialog";
import { IconAction } from "@jayantgoyal/web-ui/icon-action";
import { VisibilityBadge } from "@jayantgoyal/web-ui/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import type { Education } from "@/lib/types";
import {
  EducationDialog,
  emptyEducationForm,
  type EducationFormData,
} from "./education-dialog";

interface EducationListProps {
  initialData: Education[];
}

export function EducationList({ initialData }: EducationListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Education | null>(null);
  const [formData, setFormData] =
    useState<EducationFormData>(emptyEducationForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Education | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyEducationForm,
      sort_order:
        items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setFormError(null);
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
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        const result = await updatePortfolioData(
          "education",
          editingItem.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Education updated");
      } else {
        const result = await createPortfolioData("education", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Education added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save education";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    try {
      const result = await deletePortfolioData("education", id);
      if (result.error) throw new Error(result.error);
      toast.success("Education deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete education",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: Education) => {
    try {
      const result = await updatePortfolioData("education", item.id, {
        is_visible: !item.is_visible,
      });
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_visible: !i.is_visible } : i,
        ),
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
                      <VisibilityBadge visible={item.is_visible} />
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
                    <IconAction
                      icon={item.is_visible ? Eye : EyeOff}
                      label={
                        item.is_visible ? "Hide education" : "Show education"
                      }
                      variant="ghost"
                      onClick={() => toggleVisibility(item)}
                    />
                    <IconAction
                      icon={Pencil}
                      label="Edit education"
                      variant="ghost"
                      onClick={() => openEditDialog(item)}
                    />
                    <IconAction
                      icon={deleting === item.id ? Loader2 : Trash2}
                      iconClassName={
                        deleting === item.id ? "size-4 animate-spin" : undefined
                      }
                      label="Delete education"
                      variant="ghost"
                      onClick={() => setPendingDelete(item)}
                      disabled={deleting === item.id}
                    />
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
        errorMessage={formError}
      />
      <ConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this education entry?"
        description="This removes the entry from the About timeline in the public Portfolio."
        confirmLabel="Delete entry"
        destructive
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
      />
    </>
  );
}
