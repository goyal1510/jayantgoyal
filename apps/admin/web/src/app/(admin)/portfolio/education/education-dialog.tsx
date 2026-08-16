"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@jayantgoyal/web-ui/button";
import { FormMessage } from "@jayantgoyal/web-ui/form-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayantgoyal/web-ui/dialog";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";
import { Switch } from "@jayantgoyal/web-ui/switch";
import type { Education } from "@/lib/types";
import { AccessibleForm } from "@/components/accessible-form";

export type EducationFormData = Omit<
  Education,
  "id" | "created_at" | "updated_at"
>;

export const emptyEducationForm: EducationFormData = {
  school: "",
  degree: "",
  period: "",
  location: "",
  detail: "",
  sort_order: 0,
  is_visible: true,
};

interface EducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Education | null;
  formData: EducationFormData;
  setFormData: (data: EducationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  errorMessage?: string | null;
}

export function EducationDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
  errorMessage,
}: EducationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Education" : "Add Education"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the education entry details."
              : "Add a new education entry to your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <AccessibleForm onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="school">School / Institution</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) =>
                  setFormData({ ...formData, school: e.target.value })
                }
                placeholder="University of Example"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                value={formData.degree}
                onChange={(e) =>
                  setFormData({ ...formData, degree: e.target.value })
                }
                placeholder="Bachelor of Science in Computer Science"
                required
              />
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
                  placeholder="2018 - 2022"
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
              <Label htmlFor="detail">Additional Details</Label>
              <Input
                id="detail"
                value={formData.detail ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, detail: e.target.value })
                }
                placeholder="GPA: 3.8, Dean's List"
              />
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
