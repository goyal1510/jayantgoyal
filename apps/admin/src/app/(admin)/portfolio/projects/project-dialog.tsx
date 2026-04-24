"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@repo/ui/button";
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
import type { Project } from "@/lib/types";

export type ProjectFormData = Omit<Project, "id" | "created_at" | "updated_at">;

export const emptyProjectForm: ProjectFormData = {
  name: "",
  short_description: "",
  full_description: "",
  image_light: "",
  image_dark: "",
  tags: [],
  github_link: "",
  live_link: "",
  sort_order: 0,
  is_visible: true,
};

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Project | null;
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function ProjectDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: ProjectDialogProps) {
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
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTagInput(""); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Project" : "Add Project"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the project details."
              : "Add a new project to your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={formData.short_description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, short_description: e.target.value })
                }
                placeholder="A brief one-line description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_description">Full Description</Label>
              <Textarea
                id="full_description"
                value={formData.full_description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, full_description: e.target.value })
                }
                placeholder="Detailed description of the project..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image_light">Image URL (Light Mode)</Label>
                <Input
                  id="image_light"
                  value={formData.image_light ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, image_light: e.target.value })
                  }
                  placeholder="/images/project-light.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_dark">Image URL (Dark Mode)</Label>
                <Input
                  id="image_dark"
                  value={formData.image_dark ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, image_dark: e.target.value })
                  }
                  placeholder="/images/project-dark.png"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
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
                        className="ml-1 cursor-pointer hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github_link">GitHub Link</Label>
                <Input
                  id="github_link"
                  value={formData.github_link ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, github_link: e.target.value })
                  }
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="live_link">Live Demo Link</Label>
                <Input
                  id="live_link"
                  value={formData.live_link ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, live_link: e.target.value })
                  }
                  placeholder="https://myproject.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible: checked })
                }
              />
              <Label htmlFor="is_visible">Visible on portfolio</Label>
            </div>
          </div>
          <DialogFooter>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
