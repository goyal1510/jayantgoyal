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
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { ConfirmationDialog } from "@repo/ui/confirmation-dialog";
import { IconAction } from "@repo/ui/icon-action";
import { VisibilityBadge } from "@repo/ui/status-badge";
import type { Project } from "@/lib/types";
import {
  ProjectDialog,
  emptyProjectForm,
  type ProjectFormData,
} from "./project-dialog";

interface ProjectsListProps {
  initialData: Project[];
}

export function ProjectsList({ initialData }: ProjectsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(emptyProjectForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyProjectForm,
      sort_order:
        items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Project) => {
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
          "projects",
          editingItem.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Project updated");
      } else {
        const result = await createPortfolioData("projects", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Project added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save project";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    try {
      const result = await deletePortfolioData("projects", id);
      if (result.error) throw new Error(result.error);
      toast.success("Project deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: Project) => {
    try {
      const result = await updatePortfolioData("projects", item.id, {
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
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Showcase your work and side projects.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No projects yet. Click &quot;Add Project&quot; to get started.
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
                        alt={
                          item.image_alt || `${item.name} project screenshot`
                        }
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-4 text-center text-xs text-muted-foreground">
                        Add a full project screenshot
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <VisibilityBadge visible={item.is_visible} />
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
                      label={item.is_visible ? "Hide project" : "Show project"}
                      variant="ghost"
                      onClick={() => toggleVisibility(item)}
                    />
                    <IconAction
                      icon={Pencil}
                      label="Edit project"
                      variant="ghost"
                      onClick={() => openEditDialog(item)}
                    />
                    <IconAction
                      icon={deleting === item.id ? Loader2 : Trash2}
                      iconClassName={
                        deleting === item.id ? "size-4 animate-spin" : undefined
                      }
                      label="Delete project"
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

      <ProjectDialog
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
        title="Delete this project?"
        description="This permanently removes the project story and its screenshot from the CMS."
        confirmLabel="Delete project"
        destructive
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
      />
    </>
  );
}
