"use client";

import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { IconAction } from "@repo/ui/icon-action";
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
import { Textarea } from "@repo/ui/textarea";
import { Switch } from "@repo/ui/switch";
import type { Experience } from "@/lib/types";
import { AccessibleForm } from "@/components/accessible-form";

export type ExperienceFormData = Omit<
  Experience,
  "id" | "created_at" | "updated_at"
>;

export const emptyExperienceForm: ExperienceFormData = {
  company: "",
  company_url: null,
  company_linkedin_url: null,
  role: "",
  period: "",
  location: "",
  summary: "",
  bullets: [],
  sort_order: 0,
  is_visible: true,
};

interface ExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Experience | null;
  formData: ExperienceFormData;
  setFormData: (data: ExperienceFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  errorMessage?: string | null;
}

export function ExperienceDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
  errorMessage,
}: ExperienceDialogProps) {
  const addBullet = () => {
    setFormData({
      ...formData,
      bullets: [...formData.bullets, ""],
    });
  };

  const removeBullet = (index: number) => {
    setFormData({
      ...formData,
      bullets: formData.bullets.filter((_, i) => i !== index),
    });
  };

  const updateBullet = (index: number, value: string) => {
    const updated = [...formData.bullets];
    updated[index] = value;
    setFormData({ ...formData, bullets: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Experience" : "Add Experience"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the experience entry details."
              : "Add a new experience entry to your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <AccessibleForm onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Acme Inc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role / Position</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_url">Company or product website</Label>
                <Input
                  id="company_url"
                  type="url"
                  value={formData.company_url ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_url: e.target.value || null,
                    })
                  }
                  placeholder="https://www.example.com/"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_linkedin_url">LinkedIn profile</Label>
                <Input
                  id="company_linkedin_url"
                  type="url"
                  value={formData.company_linkedin_url ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_linkedin_url: e.target.value || null,
                    })
                  }
                  placeholder="https://www.linkedin.com/company/example/"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Input
                  id="period"
                  value={formData.period}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value })
                  }
                  placeholder="Jan 2020 - Present"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Brief description of your role..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Key Accomplishments / Responsibilities</Label>
              {formData.bullets.map((bullet, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Label
                    htmlFor={`experience-bullet-${index}`}
                    className="sr-only"
                  >
                    Accomplishment {index + 1}
                  </Label>
                  <Textarea
                    id={`experience-bullet-${index}`}
                    value={bullet}
                    onChange={(e) => updateBullet(index, e.target.value)}
                    placeholder="Describe an accomplishment..."
                    rows={2}
                    className="flex-1"
                  />
                  <IconAction
                    icon={X}
                    label="Remove accomplishment"
                    type="button"
                    variant="ghost"
                    onClick={() => removeBullet(index)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addBullet}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bullet Point
              </Button>
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
