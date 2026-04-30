"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  BookDashed,
} from "lucide-react";
import {
  createBlogData,
  updateBlogData,
  deleteBlogData,
} from "@/lib/blog-api";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
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

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyBlogForm,
      sort_order: items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
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
      sort_order: item.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = { ...formData };

      // Auto-set published_at when publishing for the first time
      if (payload.is_published && !payload.published_at) {
        payload.published_at = new Date().toISOString();
      }

      // Convert empty strings to null for nullable fields
      const sanitized = {
        ...payload,
        excerpt: payload.excerpt || null,
        cover_image: payload.cover_image || null,
        published_at: payload.published_at || null,
      };

      if (editingItem) {
        const result = await updateBlogData<BlogPost>("blog_posts", editingItem.id, sanitized);
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
        error instanceof Error ? error.message : "Failed to save blog post"
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
        error instanceof Error ? error.message : "Failed to delete blog post"
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: BlogPost) => {
    try {
      const result = await updateBlogData<BlogPost>("blog_posts", item.id, { is_visible: !item.is_visible });
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_visible: !i.is_visible } : i
        )
      );
      toast.success(item.is_visible ? "Hidden from blog" : "Now visible");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  const togglePublish = async (item: BlogPost) => {
    try {
      const updates: Partial<BlogPost> = { is_published: !item.is_published };

      // Auto-set published_at when publishing for the first time
      if (!item.is_published && !item.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const result = await updateBlogData<BlogPost>("blog_posts", item.id, updates);
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, ...updates } : i
        )
      );
      toast.success(item.is_published ? "Unpublished" : "Published");
    } catch {
      toast.error("Failed to update publish status");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blog Posts</CardTitle>
            <CardDescription>
              Manage your blog posts and articles.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No blog posts yet. Click &quot;Add Post&quot; to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.is_published ? (
                        <Badge variant="default" className="text-xs">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Draft
                        </Badge>
                      )}
                      {!item.is_visible && (
                        <span className="text-xs text-muted-foreground">
                          (Hidden)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      /{item.slug}
                    </p>
                    {item.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.excerpt}
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.published_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Published {formatDate(item.published_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVisibility(item)}
                      title={item.is_visible ? "Hide" : "Show"}
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
                      onClick={() => togglePublish(item)}
                      title={item.is_published ? "Unpublish" : "Publish"}
                    >
                      {item.is_published ? (
                        <BookOpen className="h-4 w-4" />
                      ) : (
                        <BookDashed className="h-4 w-4" />
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
