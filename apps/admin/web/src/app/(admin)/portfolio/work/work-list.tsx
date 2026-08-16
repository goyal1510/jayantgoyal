"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Github,
} from "lucide-react";
import {
  createPortfolioData,
  updatePortfolioData,
  deletePortfolioData,
} from "@/lib/portfolio-api";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import { Badge } from "@jayantgoyal/web-ui/badge";
import { ConfirmationDialog } from "@jayantgoyal/web-ui/confirmation-dialog";
import { IconAction } from "@jayantgoyal/web-ui/icon-action";
import { VisibilityBadge } from "@jayantgoyal/web-ui/status-badge";
import type { WorkItem } from "@/lib/types";
import { WorkDialog, emptyWorkForm, type WorkFormData } from "./work-dialog";

interface WorkListProps {
  initialData: WorkItem[];
}

export function WorkList({ initialData }: WorkListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [formData, setFormData] = useState<WorkFormData>(emptyWorkForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkItem | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyWorkForm,
      sort_order:
        items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: WorkItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      short_description: item.short_description,
      tags: item.tags ?? [],
      github_link: item.github_link ?? "",
      live_link: item.live_link ?? "",
      slug: item.slug,
      eyebrow: item.eyebrow,
      impact: item.impact,
      contribution: item.contribution,
      year_label: item.year_label,
      image_url: item.image_url,
      image_alt: item.image_alt,
      case_study: item.case_study,
      case_study_published: item.case_study_published,
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
          "work",
          editingItem.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Work updated");
      } else {
        const result = await createPortfolioData("work", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Work added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save work";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    try {
      const result = await deletePortfolioData("work", id);
      if (result.error) throw new Error(result.error);
      toast.success("Work deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete work",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: WorkItem) => {
    try {
      const result = await updatePortfolioData("work", item.id, {
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
            <CardTitle>Work</CardTitle>
            <CardDescription>Showcase your work and side work.</CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Work
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No work yet. Click &quot;Add Work&quot; to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row"
                >
                  <div className="flex aspect-[16/10] w-full shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 sm:w-56">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.image_alt || `${item.name} work screenshot`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-4 text-center text-xs text-muted-foreground">
                        Add a full work screenshot
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <VisibilityBadge visible={item.is_visible} />
                      {item.case_study_published ? (
                        <Badge variant="secondary">Case study</Badge>
                      ) : null}
                    </div>
                    {item.short_description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.short_description}
                      </p>
                    )}
                    {!item.image_alt && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        Missing image description
                      </Badge>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {item.github_link && (
                        <a
                          href={item.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <Github className="h-3 w-3" />
                          GitHub
                        </a>
                      )}
                      {item.live_link && (
                        <a
                          href={item.live_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Live
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconAction
                      icon={item.is_visible ? Eye : EyeOff}
                      label={item.is_visible ? "Hide work" : "Show work"}
                      variant="ghost"
                      onClick={() => toggleVisibility(item)}
                    />
                    <IconAction
                      icon={Pencil}
                      label="Edit work"
                      variant="ghost"
                      onClick={() => openEditDialog(item)}
                    />
                    <IconAction
                      icon={deleting === item.id ? Loader2 : Trash2}
                      iconClassName={
                        deleting === item.id ? "size-4 animate-spin" : undefined
                      }
                      label="Delete work"
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

      <WorkDialog
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
        title="Delete this work?"
        description="This permanently removes the work story and its screenshot from the CMS."
        confirmLabel="Delete work"
        destructive
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
      />
    </>
  );
}
