"use client";

import { Loader2 } from "lucide-react";
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
import type { Certificate } from "@/lib/types";

export type CertificateFormData = Omit<Certificate, "id" | "created_at" | "updated_at">;

export const emptyCertificateForm: CertificateFormData = {
  name: "",
  path: "",
  description: "",
  category: "",
  issuer: "",
  sort_order: 0,
  is_visible: true,
};

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Certificate | null;
  formData: CertificateFormData;
  setFormData: (data: CertificateFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function CertificateDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: CertificateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Certificate" : "Add Certificate"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the certificate details."
              : "Add a new certificate to your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Certificate Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="AWS Solutions Architect"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Certificate Path / URL</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) =>
                  setFormData({ ...formData, path: e.target.value })
                }
                placeholder="/certificates/aws-sa.pdf or https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Path to the certificate file or verification URL
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  value={formData.issuer ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, issuer: e.target.value })
                  }
                  placeholder="Amazon Web Services"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Cloud Computing"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the certification..."
                rows={3}
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
