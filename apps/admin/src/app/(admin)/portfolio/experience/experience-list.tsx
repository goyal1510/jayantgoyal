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
import { Button } from "@repo/ui/button";
import { ConfirmationDialog } from "@repo/ui/confirmation-dialog";
import { IconAction } from "@repo/ui/icon-action";
import { VisibilityBadge } from "@repo/ui/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import type { Experience } from "@/lib/types";
import {
  ExperienceDialog,
  emptyExperienceForm,
  type ExperienceFormData,
} from "./experience-dialog";

interface ExperienceListProps {
  initialData: Experience[];
}

export function ExperienceList({ initialData }: ExperienceListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Experience | null>(null);
  const [formData, setFormData] =
    useState<ExperienceFormData>(emptyExperienceForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Experience | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyExperienceForm,
      sort_order:
        items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Experience) => {
    setEditingItem(item);
    setFormData({
      company: item.company,
      company_url: item.company_url,
      company_linkedin_url: item.company_linkedin_url,
      role: item.role,
      period: item.period,
      location: item.location ?? "",
      summary: item.summary ?? "",
      bullets: item.bullets ?? [],
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
          "experience",
          editingItem.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Experience updated");
      } else {
        const result = await createPortfolioData("experience", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Experience added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save experience";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    try {
      const result = await deletePortfolioData("experience", id);
      if (result.error) throw new Error(result.error);
      toast.success("Experience deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete experience",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: Experience) => {
    try {
      const result = await updatePortfolioData("experience", item.id, {
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
            <CardTitle>Experience Entries</CardTitle>
            <CardDescription>
              Add and manage your work experience.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No experience entries yet. Click &quot;Add Experience&quot; to get
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
                      <h3 className="font-semibold">{item.role}</h3>
                      <VisibilityBadge visible={item.is_visible} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.company} • {item.period}
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
                      label={item.is_visible ? "Hide role" : "Show role"}
                      variant="ghost"
                      onClick={() => toggleVisibility(item)}
                    />
                    <IconAction
                      icon={Pencil}
                      label="Edit role"
                      variant="ghost"
                      onClick={() => openEditDialog(item)}
                    />
                    <IconAction
                      icon={deleting === item.id ? Loader2 : Trash2}
                      iconClassName={
                        deleting === item.id ? "size-4 animate-spin" : undefined
                      }
                      label="Delete role"
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

      <ExperienceDialog
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
        title="Delete this role?"
        description="This removes the role from the Experience timeline in the public Portfolio."
        confirmLabel="Delete role"
        destructive
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
      />
    </>
  );
}
