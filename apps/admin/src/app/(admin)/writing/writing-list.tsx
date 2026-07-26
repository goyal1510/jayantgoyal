"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getWritingPublicationState,
  isPublicWritingPost,
} from "@repo/portfolio-data";
import {
  createWritingData,
  updateWritingData,
  deleteWritingData,
} from "@/lib/writing-api";
import { Button } from "@repo/ui/button";
import { ConfirmationDialog } from "@repo/ui/confirmation-dialog";
import { IconAction } from "@repo/ui/icon-action";
import { StatusBadge } from "@repo/ui/status-badge";
import type { WritingPost } from "@/lib/types";
import {
  WritingDialog,
  emptyWritingForm,
  type WritingFormData,
} from "./writing-dialog";

interface WritingListProps {
  initialData: WritingPost[];
}

export function WritingList({ initialData }: WritingListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WritingPost | null>(null);
  const [formData, setFormData] = useState<WritingFormData>(emptyWritingForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WritingPost | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyWritingForm,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: WritingPost) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt ?? "",
      content: item.content,
      cover_image: item.cover_image ?? "",
      tags: item.tags ?? [],
      is_published: item.is_published,
      published_at: item.published_at ?? "",
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
      const payload = { ...formData };
      const sanitized = {
        ...payload,
        excerpt: payload.excerpt || null,
        cover_image: payload.cover_image || null,
        published_at: payload.published_at || null,
      };

      if (editingItem) {
        const result = await updateWritingData(
          "writing_posts",
          editingItem.id,
          sanitized,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Writing post updated");
      } else {
        const result = await createWritingData("writing_posts", sanitized);
        if (result.error) throw new Error(result.error);
        toast.success("Writing post added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save writing post";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const result = await deleteWritingData("writing_posts", id);
      if (result.error) throw new Error(result.error);
      toast.success("Writing post deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete writing post",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: WritingPost) => {
    try {
      const result = await updateWritingData("writing_posts", item.id, {
        is_visible: !item.is_visible,
      });
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_visible: !i.is_visible } : i,
        ),
      );
      toast.success(item.is_visible ? "Hidden" : "Visible");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Post
        </Button>
      </div>

      <div className="rounded-lg border">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No writing posts yet.
          </p>
        ) : (
          items.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 px-4 py-3 ${i !== items.length - 1 ? "border-b" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{item.title}</p>
                  {(() => {
                    const state = getWritingPublicationState(item);
                    return (
                      <StatusBadge
                        status={state}
                        className="shrink-0 text-xs"
                      />
                    );
                  })()}
                </div>
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {item.excerpt}
                  </p>
                )}
              </div>
              {item.published_at && (
                <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {new Date(item.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
              {isPublicWritingPost(item) ? (
                <a
                  href={`${process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://jayantgoyal.com"}/writing/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  View <ExternalLink className="size-3" />
                </a>
              ) : null}
              <div className="flex shrink-0 items-center gap-1">
                <IconAction
                  icon={item.is_visible ? Eye : EyeOff}
                  label={item.is_visible ? "Hide article" : "Show article"}
                  variant="ghost"
                  onClick={() => toggleVisibility(item)}
                />
                <IconAction
                  icon={Pencil}
                  label="Edit article"
                  variant="ghost"
                  onClick={() => openEditDialog(item)}
                />
                <IconAction
                  icon={deleting === item.id ? Loader2 : Trash2}
                  iconClassName={
                    deleting === item.id ? "size-4 animate-spin" : undefined
                  }
                  label="Delete article"
                  variant="ghost"
                  onClick={() => setPendingDelete(item)}
                  disabled={deleting === item.id}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <WritingDialog
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
        title="Delete this article?"
        description="This permanently removes the article from the CMS and the public Portfolio."
        confirmLabel="Delete article"
        destructive
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
      />
    </>
  );
}
