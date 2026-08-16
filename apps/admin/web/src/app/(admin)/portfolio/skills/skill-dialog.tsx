"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@jayant/web-ui/button";
import { FormMessage } from "@jayant/web-ui/form-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayant/web-ui/dialog";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import { Switch } from "@jayant/web-ui/switch";
import { Textarea } from "@jayant/web-ui/textarea";
import type { Skill } from "@/lib/types";
import { AccessibleForm } from "@/components/accessible-form";

export type SkillFormData = Omit<Skill, "id" | "created_at" | "updated_at">;

export const emptySkillForm: SkillFormData = {
  category_id: "",
  name: "",
  proficiency: "strong",
  evidence: "",
  sort_order: 0,
  is_visible: true,
};

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Skill | null;
  formData: SkillFormData;
  setFormData: (data: SkillFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  errorMessage?: string | null;
}

export function SkillDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
  errorMessage,
}: SkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Skill" : "Add Skill"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the skill details."
              : "Add a new skill to this category."}
          </DialogDescription>
        </DialogHeader>
        <AccessibleForm onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="React"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-proficiency">Editorial Proficiency</Label>
              <select
                id="skill-proficiency"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                value={formData.proficiency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proficiency: e.target.value as SkillFormData["proficiency"],
                  })
                }
              >
                <option value="core">Core</option>
                <option value="strong">Strong</option>
                <option value="working">Working</option>
                <option value="exploring">Exploring</option>
              </select>
              <p className="text-xs text-muted-foreground">
                The Portfolio uses these honest labels instead of progress bars.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-evidence">Evidence</Label>
              <Textarea
                id="skill-evidence"
                value={formData.evidence}
                onChange={(e) =>
                  setFormData({ ...formData, evidence: e.target.value })
                }
                placeholder="Where has this skill been applied?"
                rows={3}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="skill-sort">Sort Order</Label>
                <Input
                  id="skill-sort"
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
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="skill-visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible: checked })
                }
              />
              <Label htmlFor="skill-visible">Visible on portfolio</Label>
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
