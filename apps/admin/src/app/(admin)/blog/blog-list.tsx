"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { createBlogData, updateBlogData, deleteBlogData } from "@/lib/blog-api";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import type { BlogPost } from "@/lib/types";
import { BlogDialog, emptyBlogForm, type BlogFormData } from "./blog-dialog";

interface BlogListProps {
  initialData: BlogPost[];
}

export function BlogList({ initialData }: BlogListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(emptyBlogForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyBlogForm,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: BlogPost) => {
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
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = { ...formData };
      if (payload.is_published && !payload.published_at) {
        payload.published_at = new Date().toISOString();
      }

      const sanitized = {
        ...payload,
        excerpt: payload.excerpt || null,
        cover_image: payload.cover_image || null,
        published_at: payload.published_at || null,
      };

      if (editingItem) {
        const result = await updateBlogData<BlogPost>(
          "blog_posts",
          editingItem.id,
          sanitized,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Blog post updated");
      } else {
        const result = await createBlogData<BlogPost>("blog_posts", sanitized);
        if (result.error) throw new Error(result.error);
        toast.success("Blog post added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save blog post",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    setDeleting(id);
    try {
      const result = await deleteBlogData("blog_posts", id);
      if (result.error) throw new Error(result.error);
      toast.success("Blog post deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete blog post",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: BlogPost) => {
    try {
      const result = await updateBlogData<BlogPost>("blog_posts", item.id, {
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
            No blog posts yet.
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
                  {item.is_published ? (
                    <Badge variant="default" className="text-xs shrink-0">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Draft
                    </Badge>
                  )}
                  {!item.is_visible && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Hidden
                    </Badge>
                  )}
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
              <div className="flex shrink-0 items-center gap-1">
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
          ))
        )}
      </div>

      <BlogDialog
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
