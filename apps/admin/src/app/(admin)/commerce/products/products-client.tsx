"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  createCommerceProduct,
  updateCommerceProduct,
  type CommerceProductPayload,
} from "@/lib/commerce-api";
import { formatMoneyMinor, formatDateTime } from "@/lib/commerce-format";
import type { CommerceProductWithPrices } from "@/lib/types";
import {
  CommerceProductDialog,
  emptyCommerceProductForm,
  generateSlug,
  type CommerceProductFormData,
} from "./product-dialog";

interface CommerceProductsClientProps {
  initialData: CommerceProductWithPrices[];
}

function toProductForm(item: CommerceProductWithPrices): CommerceProductFormData {
  return {
    product: {
      slug: item.slug,
      name: item.name,
      short_description: item.short_description ?? "",
      description: item.description ?? "",
      product_type: item.product_type,
      status: item.status,
      payment_provider: item.payment_provider ?? "razorpay",
      stripe_product_id: item.stripe_product_id ?? "",
      image_url: item.image_url ?? "",
      is_featured: item.is_featured,
      sort_order: item.sort_order,
      metadata: item.metadata ?? {},
    },
    prices:
      item.prices.length > 0
        ? item.prices.map((price) => ({
            id: price.id,
            payment_provider: price.payment_provider,
            provider_price_id: price.provider_price_id ?? "",
            stripe_price_id: price.stripe_price_id ?? "",
            lookup_key: price.lookup_key ?? "",
            nickname: price.nickname ?? "",
            price_type: price.price_type,
            currency: price.currency,
            unit_amount: price.unit_amount,
            billing_interval: price.billing_interval,
            trial_period_days: price.trial_period_days,
            is_active: price.is_active,
          }))
        : emptyCommerceProductForm.prices,
  };
}

function withGeneratedPriceKey(form: CommerceProductFormData) {
  const slug = form.product.slug || generateSlug(form.product.name);
  return {
    ...form,
    product: {
      ...form.product,
      slug,
    },
    prices: form.prices.map((price, index) => ({
      ...price,
      lookup_key: price.lookup_key || (slug ? `${slug}-${price.currency || "inr"}-${index + 1}` : ""),
      payment_provider: price.payment_provider ?? form.product.payment_provider ?? "razorpay",
    })),
  } satisfies CommerceProductPayload;
}

function statusVariant(status: CommerceProductWithPrices["status"]) {
  if (status === "published") return "default";
  if (status === "archived") return "outline";
  return "secondary";
}

export function CommerceProductsClient({ initialData }: CommerceProductsClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommerceProductWithPrices | null>(null);
  const [formData, setFormData] = useState<CommerceProductFormData>(emptyCommerceProductForm);
  const [saving, setSaving] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyCommerceProductForm,
      product: {
        ...emptyCommerceProductForm.product,
        sort_order: items.length > 0 ? Math.max(...items.map((item) => item.sort_order)) + 1 : 0,
      },
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: CommerceProductWithPrices) => {
    setEditingItem(item);
    setFormData(toProductForm(item));
    setDialogOpen(true);
  };

  const saveResult = (product: CommerceProductWithPrices) => {
    setItems((current) => {
      const exists = current.some((item) => item.id === product.id);
      const next = exists
        ? current.map((item) => (item.id === product.id ? product : item))
        : [product, ...current];
      return next.sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at));
    });
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = withGeneratedPriceKey(formData);
      const result = editingItem
        ? await updateCommerceProduct(editingItem.id, payload)
        : await createCommerceProduct(payload);

      if (result.error) throw new Error(result.error);
      if (result.data) saveResult(result.data);

      toast.success(editingItem ? "Product updated" : "Product created");
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const setProductStatus = async (
    item: CommerceProductWithPrices,
    status: CommerceProductWithPrices["status"]
  ) => {
    setMutatingId(item.id);
    try {
      const payload = toProductForm(item);
      payload.product.status = status;
      const result = await updateCommerceProduct(item.id, payload);
      if (result.error) throw new Error(result.error);
      if (result.data) saveResult(result.data);
      toast.success(status === "published" ? "Product published" : "Product updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    } finally {
      setMutatingId(null);
    }
  };

  const productCount = items.length;
  const publishedCount = items.filter((item) => item.status === "published").length;
  const activePriceCount = items.reduce(
    (count, item) => count + item.prices.filter((price) => price.is_active).length,
    0
  );

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commerce products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {productCount} products, {publishedCount} published, {activePriceCount} active prices.
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </div>

      <div className="rounded-lg border">
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium">No commerce products yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a paid product before sending buyers to checkout.
            </p>
          </div>
        ) : (
          items.map((item, index) => {
            const activePrices = item.prices.filter((price) => price.is_active);
            const primaryPrice = activePrices[0] ?? item.prices[0] ?? null;

            return (
              <div
                key={item.id}
                className={`grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_150px] ${
                  index !== items.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{item.name}</p>
                    <Badge variant={statusVariant(item.status)} className="capitalize">
                      {item.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {item.payment_provider ?? "razorpay"}
                    </Badge>
                    {item.is_featured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    /store/{item.slug}
                  </p>
                  {item.short_description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.short_description}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Price</p>
                  <p className="mt-1 text-sm font-medium">
                    {primaryPrice
                      ? formatMoneyMinor(primaryPrice.unit_amount, primaryPrice.currency)
                      : "No price"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activePrices.length} active of {item.prices.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Published</p>
                  <p className="mt-1 text-sm">{formatDateTime(item.published_at)}</p>
                </div>

                <div className="flex items-start justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={mutatingId === item.id}
                    title={item.status === "published" ? "Move to draft" : "Publish"}
                    onClick={() =>
                      setProductStatus(item, item.status === "published" ? "draft" : "published")
                    }
                  >
                    {item.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Edit"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={mutatingId === item.id || item.status === "archived"}
                    title="Archive"
                    onClick={() => setProductStatus(item, "archived")}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CommerceProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </>
  );
}
