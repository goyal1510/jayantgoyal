"use client";

import { useState } from "react";
import { Loader2, X, Wand2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { FormMessage } from "@repo/ui/form-message";
import { IconAction } from "@repo/ui/icon-action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { Switch } from "@repo/ui/switch";
import { Badge } from "@repo/ui/badge";
import type { BlogPost } from "@/lib/types";
import { PortfolioAssetUpload } from "@/components/portfolio/asset-upload";
import { MarkdownPreview } from "@/components/portfolio/markdown-preview";
import { AccessibleForm } from "@/components/accessible-form";

export type BlogFormData = Omit<BlogPost, "id" | "created_at" | "updated_at">;

export const emptyBlogForm: BlogFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  tags: [],
  is_published: false,
  published_at: "",
  is_visible: true,
};

interface BlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BlogPost | null;
  formData: BlogFormData;
  setFormData: (data: BlogFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  errorMessage?: string | null;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return "";
  }
}

export function BlogDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
  errorMessage,
}: BlogDialogProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTagInput("");
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Blog Post" : "Add Blog Post"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the blog post details."
              : "Create a new blog post."}
          </DialogDescription>
        </DialogHeader>
        <AccessibleForm onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="My Blog Post Title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="my-blog-post-title"
                  required
                  className="font-mono"
                />
                <IconAction
                  onClick={() =>
                    setFormData({
                      ...formData,
                      slug: generateSlug(formData.title),
                    })
                  }
                  icon={Wand2}
                  label="Generate slug from title"
                  variant="outline"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="A brief summary of the post..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="content">Content</Label>
                <span className="text-xs text-muted-foreground">
                  Markdown · preview matches public syntax
                </span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Write your blog post in Markdown..."
                  rows={12}
                  required
                />
                <MarkdownPreview content={formData.content} />
              </div>
            </div>

            <PortfolioAssetUpload
              id="cover_image"
              label="Cover Image"
              kind="blog-cover"
              value={formData.cover_image ?? ""}
              onChange={(cover_image) =>
                setFormData({ ...formData, cover_image })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="blog-tag-input">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="blog-tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type a tag and press Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="ml-1 cursor-pointer rounded-sm p-0.5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="published_at">Published At</Label>
              <Input
                id="published_at"
                type="datetime-local"
                value={toDatetimeLocalValue(formData.published_at)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    published_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_visible"
                  checked={formData.is_visible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_visible: checked })
                  }
                />
                <Label htmlFor="is_visible">Visible</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <FormMessage>{errorMessage}</FormMessage>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </AccessibleForm>
      </DialogContent>
    </Dialog>
  );
}
