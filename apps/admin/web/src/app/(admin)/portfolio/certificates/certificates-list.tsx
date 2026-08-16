"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Award,
} from "lucide-react";
import {
  createPortfolioData,
  updatePortfolioData,
  deletePortfolioData,
} from "@/lib/portfolio-api";
import { Button } from "@jayant/web-ui/button";
import { ConfirmationDialog } from "@jayant/web-ui/confirmation-dialog";
import { IconAction } from "@jayant/web-ui/icon-action";
import { VisibilityBadge } from "@jayant/web-ui/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayant/web-ui/card";
import type { Certificate } from "@/lib/types";
import {
  CertificateDialog,
  emptyCertificateForm,
  type CertificateFormData,
} from "./certificate-dialog";

interface CertificatesListProps {
  initialData: Certificate[];
}

export function CertificatesList({ initialData }: CertificatesListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certificate | null>(null);
  const [formData, setFormData] =
    useState<CertificateFormData>(emptyCertificateForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Certificate | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyCertificateForm,
      sort_order:
        items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Certificate) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      issuer: item.issuer,
      issued_at: item.issued_at,
      credential_id: item.credential_id ?? "",
      credential_url: item.credential_url ?? "",
      document_url: item.document_url,
      preview_url: item.preview_url,
      image_alt: item.image_alt,
      sort_order: item.sort_order,
      is_visible: item.is_visible,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        const result = await updatePortfolioData(
          "certificates",
          editingItem.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Certificate updated");
      } else {
        const result = await createPortfolioData("certificates", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Certificate added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save certificate";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    try {
      const result = await deletePortfolioData("certificates", id);
      if (result.error) throw new Error(result.error);
      toast.success("Certificate deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete certificate",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: Certificate) => {
    try {
      const result = await updatePortfolioData("certificates", item.id, {
        is_visible: !item.is_visible,
      });
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_visible: !i.is_visible } : i,
        ),
      );
      toast.success(item.is_visible ? "Hidden from portfolio" : "Now visible");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  const categories = [...new Set(items.map((i) => i.category || "Other"))];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Certificates & Credentials</CardTitle>
            <CardDescription>
              Showcase your certifications and achievements.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Certificate
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No certificates yet. Click &quot;Add Certificate&quot; to get
              started.
            </p>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {items
                      .filter((i) => (i.category || "Other") === category)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-lg border p-4"
                        >
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Award className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <VisibilityBadge visible={item.is_visible} />
                            </div>
                            {item.issuer && (
                              <p className="text-sm text-muted-foreground">
                                {item.issuer}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <IconAction
                              icon={item.is_visible ? Eye : EyeOff}
                              label={
                                item.is_visible
                                  ? "Hide credential"
                                  : "Show credential"
                              }
                              variant="ghost"
                              onClick={() => toggleVisibility(item)}
                            />
                            <IconAction
                              icon={Pencil}
                              label="Edit credential"
                              variant="ghost"
                              onClick={() => openEditDialog(item)}
                            />
                            <IconAction
                              icon={deleting === item.id ? Loader2 : Trash2}
                              iconClassName={
                                deleting === item.id
                                  ? "size-4 animate-spin"
                                  : undefined
                              }
                              label="Delete credential"
                              variant="ghost"
                              onClick={() => setPendingDelete(item)}
                              disabled={deleting === item.id}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CertificateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        saving={saving}
        errorMessage={formError}
      />
      <ConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this credential?"
        description="This removes the credential from the Experience workspace and public Portfolio."
        confirmLabel="Delete credential"
        destructive
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
      />
    </>
  );
}
