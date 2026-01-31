"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { ShortUrl } from "@/lib/types";
import { createUrl, updateUrl, deleteUrl } from "@/lib/urls-api";

const SHORT_DOMAIN = "url.jayantgoyal.com";

interface FormData {
  slug: string;
  target_url: string;
  title: string;
  is_active: boolean;
}

const emptyForm: FormData = {
  slug: "",
  target_url: "",
  title: "",
  is_active: true,
};

export function UrlsManager({ initialData }: { initialData: ShortUrl[] }) {
  const [items, setItems] = React.useState<ShortUrl[]>(initialData);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ShortUrl | null>(null);
  const [formData, setFormData] = React.useState<FormData>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function openCreate() {
    setEditingItem(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(item: ShortUrl) {
    setEditingItem(item);
    setFormData({
      slug: item.slug,
      target_url: item.target_url,
      title: item.title ?? "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingItem) {
        const updated = await updateUrl(editingItem.id, formData);
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? updated : i))
        );
        toast.success("URL updated");
      } else {
        const created = await createUrl(formData);
        setItems((prev) => [created, ...prev]);
        toast.success("URL created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteUrl(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("URL deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(item: ShortUrl) {
    try {
      const updated = await updateUrl(item.id, {
        is_active: !item.is_active,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      toast.success(
        updated.is_active ? "URL activated" : "URL deactivated"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  }

  function copyToClipboard(slug: string) {
    navigator.clipboard.writeText(`${SHORT_DOMAIN}/${slug}`);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Short URLs</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} URL{items.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add URL
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No short URLs yet.</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>
              Create your first URL
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {item.title || item.slug}
                    </span>
                    <Badge
                      variant={item.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <BarChart3 className="mr-1 h-3 w-3" />
                      {item.clicks} click{item.clicks !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {SHORT_DOMAIN}/{item.slug}
                    </code>
                    <button
                      onClick={() => copyToClipboard(item.slug)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy short URL"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    <a
                      href={item.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {item.target_url}
                      <ExternalLink className="ml-1 inline h-3 w-3" />
                    </a>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleActive(item)}
                    aria-label="Toggle active"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit URL" : "Create URL"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the short URL details."
                : "Create a new short URL redirect."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {SHORT_DOMAIN}/
                </span>
                <Input
                  id="slug"
                  placeholder="my-link"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase(),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target_url">Target URL</Label>
              <Input
                id="target_url"
                type="url"
                placeholder="https://example.com/long-page"
                value={formData.target_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_url: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="My Link"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Saving..."
                : editingItem
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
