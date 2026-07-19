"use client";

import { Loader2 } from "lucide-react";

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
import { AccessibleForm } from "@/components/accessible-form";
import type { Certificate } from "@/lib/types";

export type CertificateFormData = Omit<
  Certificate,
  "id" | "created_at" | "updated_at"
>;

export const emptyCertificateForm: CertificateFormData = {
  name: "",
  description: "",
  category: "",
  issuer: "",
  issued_at: null,
  credential_id: "",
  credential_url: "",
  document_url: "",
  preview_url: "",
  image_alt: "",
  sort_order: 0,
  is_visible: true,
};

export function CertificateDialog({
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
  editing: Certificate | null;
  formData: CertificateFormData;
  setFormData: (data: CertificateFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  errorMessage?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Certificate" : "Add Certificate"}
          </DialogTitle>
          <DialogDescription>
            The document, preview, and credential details all appear in the
            public certificate deck.
          </DialogDescription>
        </DialogHeader>
        <AccessibleForm onSubmit={onSubmit}>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Certificate Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(event) =>
                    setFormData({ ...formData, issuer: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(event) =>
                    setFormData({ ...formData, category: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                rows={3}
              />
            </div>

            <PortfolioAssetUpload
              id="document_url"
              label="Certificate PDF"
              kind="certificate-document"
              value={formData.document_url}
              onChange={(document_url) =>
                setFormData({ ...formData, document_url })
              }
              required
            />
            <PortfolioAssetUpload
              id="preview_url"
              label="Certificate Preview"
              kind="certificate-preview"
              value={formData.preview_url}
              onChange={(preview_url) =>
                setFormData({ ...formData, preview_url })
              }
              required
            />

            <div className="space-y-2">
              <Label htmlFor="image_alt">Preview Description</Label>
              <Input
                id="image_alt"
                value={formData.image_alt}
                onChange={(event) =>
                  setFormData({ ...formData, image_alt: event.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issued_at">Issued Date</Label>
                <Input
                  id="issued_at"
                  type="date"
                  value={formData.issued_at ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      issued_at: event.target.value || null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential_id">Credential ID</Label>
                <Input
                  id="credential_id"
                  value={formData.credential_id ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      credential_id: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credential_url">Verification URL</Label>
              <Input
                id="credential_url"
                type="url"
                value={formData.credential_url ?? ""}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    credential_url: event.target.value,
                  })
                }
              />
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
              {editing ? "Update Certificate" : "Add Certificate"}
            </Button>
          </DialogFooter>
        </AccessibleForm>
      </DialogContent>
    </Dialog>
  );
}
