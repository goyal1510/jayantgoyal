"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { FormMessage } from "@repo/ui/form-message";
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
import { Switch } from "@repo/ui/switch";
import { Textarea } from "@repo/ui/textarea";

import { PortfolioAssetUpload } from "@/components/portfolio/asset-upload";
import type { Project } from "@/lib/types";

export type ProjectFormData = Omit<Project, "id" | "created_at" | "updated_at">;

export const emptyProjectForm: ProjectFormData = {
  name: "",
  slug: "",
  eyebrow: "",
  short_description: "",
  impact: "",
  contribution: "",
  year_label: "",
  image_url: "",
  image_alt: "",
  tags: [],
  github_link: "",
  live_link: "",
  sort_order: 0,
  is_visible: true,
};

export function ProjectDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Project | null;
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  errorMessage?: string | null;
}) {
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || formData.tags.includes(tag)) return;
    setFormData({ ...formData, tags: [...formData.tags, tag] });
    setTagInput("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setTagInput("");
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>
            Every field below maps directly to the public project story.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(event) =>
                    setFormData({ ...formData, slug: event.target.value })
                  }
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eyebrow">Story Category</Label>
                <Input
                  id="eyebrow"
                  value={formData.eyebrow}
                  onChange={(event) =>
                    setFormData({ ...formData, eyebrow: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_label">Year Label</Label>
                <Input
                  id="year_label"
                  value={formData.year_label}
                  onChange={(event) =>
                    setFormData({ ...formData, year_label: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Project Summary</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    short_description: event.target.value,
                  })
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Outcome / Impact</Label>
              <Textarea
                id="impact"
                value={formData.impact}
                onChange={(event) =>
                  setFormData({ ...formData, impact: event.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribution">Contribution</Label>
              <Input
                id="contribution"
                value={formData.contribution}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    contribution: event.target.value,
                  })
                }
                required
              />
            </div>

            <PortfolioAssetUpload
              id="image_url"
              label="Full Project Screenshot"
              kind="project-image"
              value={formData.image_url}
              onChange={(image_url) => setFormData({ ...formData, image_url })}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="image_alt">Screenshot Description</Label>
              <Input
                id="image_alt"
                value={formData.image_alt}
                onChange={(event) =>
                  setFormData({ ...formData, image_alt: event.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-tag-input">Technologies</Label>
              <div className="flex gap-2">
                <Input
                  id="project-tag-input"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Type a technology and press Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      className="ml-1"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((item) => item !== tag),
                        })
                      }
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="live_link">Live Product URL</Label>
                <Input
                  id="live_link"
                  type="url"
                  value={formData.live_link ?? ""}
                  onChange={(event) =>
                    setFormData({ ...formData, live_link: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_link">Source URL</Label>
                <Input
                  id="github_link"
                  type="url"
                  value={formData.github_link ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      github_link: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Display Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      sort_order: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  id="is_visible"
                  checked={formData.is_visible}
                  onCheckedChange={(is_visible) =>
                    setFormData({ ...formData, is_visible })
                  }
                />
                <Label htmlFor="is_visible">Visible on Portfolio</Label>
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
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editing ? "Update Project" : "Add Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
