"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Certificate } from "@/lib/types";

interface CertificatesListProps {
  initialData: Certificate[];
}

type FormData = Omit<Certificate, "id" | "created_at" | "updated_at">;

const emptyForm: FormData = {
  name: "",
  path: "",
  description: "",
  category: "",
  issuer: "",
  sort_order: 0,
  is_visible: true,
};

export function CertificatesList({ initialData }: CertificatesListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certificate | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      sort_order: items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Certificate) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      path: item.path,
      description: item.description ?? "",
      category: item.category ?? "",
      issuer: item.issuer ?? "",
      sort_order: item.sort_order,
      is_visible: item.is_visible,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingItem) {
        const result = await updatePortfolioData<Certificate>("certificates", editingItem.id, formData);
        if (result.error) throw new Error(result.error);
        toast.success("Certificate updated");
      } else {
        const result = await createPortfolioData<Certificate>("certificates", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Certificate added");
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save certificate"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;

    setDeleting(id);

    try {
      const result = await deletePortfolioData("certificates", id);
      if (result.error) throw new Error(result.error);
      toast.success("Certificate deleted");
      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete certificate"
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleVisibility = async (item: Certificate) => {
    try {
      const result = await updatePortfolioData<Certificate>("certificates", item.id, { is_visible: !item.is_visible });
      if (result.error) throw new Error(result.error);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_visible: !i.is_visible } : i
        )
      );
      toast.success(item.is_visible ? "Hidden from portfolio" : "Now visible");
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  // Group certificates by category
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
                              {!item.is_visible && (
                                <span className="text-xs text-muted-foreground">
                                  (Hidden)
                                </span>
                              )}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleVisibility(item)}
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Certificate" : "Add Certificate"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the certificate details."
                : "Add a new certificate to your portfolio."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
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
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
