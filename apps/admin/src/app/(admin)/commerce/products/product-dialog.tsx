"use client";

import { Plus, Trash2, Wand2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Switch } from "@repo/ui/switch";
import { Textarea } from "@repo/ui/textarea";
import type { CommerceProductWithPrices } from "@/lib/types";
import type { CommerceProductPayload } from "@/lib/commerce-api";

export type CommerceProductFormData = CommerceProductPayload;

const defaultPrice = {
  id: null,
  payment_provider: "razorpay" as const,
  provider_price_id: null,
  stripe_price_id: null,
  lookup_key: "",
  nickname: "",
  price_type: "one_time" as const,
  currency: "inr",
  unit_amount: 100,
  billing_interval: null,
  trial_period_days: null,
  is_active: true,
};

export const emptyCommerceProductForm: CommerceProductFormData = {
  product: {
    slug: "",
    name: "",
    short_description: "",
    description: "",
    product_type: "digital",
    status: "draft",
    payment_provider: "razorpay",
    stripe_product_id: "",
    image_url: "",
    is_featured: false,
    sort_order: 0,
    metadata: {
      delivery_plan: "",
      launch_note: "",
    },
  },
  prices: [defaultPrice],
};

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CommerceProductWithPrices | null;
  formData: CommerceProductFormData;
  setFormData: (data: CommerceProductFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
}

export function generateSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function updatePrice(
  formData: CommerceProductFormData,
  index: number,
  patch: Partial<CommerceProductFormData["prices"][number]>
) {
  return {
    ...formData,
    prices: formData.prices.map((price, priceIndex) =>
      priceIndex === index ? { ...price, ...patch } : price
    ),
  };
}

function metadataText(
  metadata: Record<string, unknown> | null | undefined,
  key: "delivery_plan" | "launch_note"
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function updateMetadata(
  formData: CommerceProductFormData,
  key: "delivery_plan" | "launch_note",
  value: string
) {
  return {
    ...formData,
    product: {
      ...formData.product,
      metadata: {
        ...(formData.product.metadata ?? {}),
        [key]: value,
      },
    },
  };
}

export function CommerceProductDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
}: ProductDialogProps) {
  const addPrice = () => {
    setFormData({
      ...formData,
      prices: [
        ...formData.prices,
        {
          ...defaultPrice,
          lookup_key: formData.product.slug ? `${formData.product.slug}-inr` : "",
        },
      ],
    });
  };

  const removeNewPrice = (index: number) => {
    const price = formData.prices[index];
    if (!price || price.id || formData.prices.length === 1) return;
    setFormData({
      ...formData,
      prices: formData.prices.filter((_, priceIndex) => priceIndex !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Manage the paid catalog item and its checkout prices.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={formData.product.name}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    product: { ...formData.product, name: event.target.value },
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="product-slug"
                  value={formData.product.slug}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      product: { ...formData.product, slug: event.target.value },
                    })
                  }
                  className="font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Generate slug"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      product: {
                        ...formData.product,
                        slug: generateSlug(formData.product.name),
                      },
                    })
                  }
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-type">Type</Label>
              <Select
                value={formData.product.product_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    product: {
                      ...formData.product,
                      product_type: value as CommerceProductFormData["product"]["product_type"],
                    },
                  })
                }
              >
                <SelectTrigger id="product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="bundle">Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-status">Status</Label>
              <Select
                value={formData.product.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    product: {
                      ...formData.product,
                      status: value as CommerceProductFormData["product"]["status"],
                    },
                  })
                }
              >
                <SelectTrigger id="product-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-provider">Provider</Label>
              <Select
                value={formData.product.payment_provider ?? "razorpay"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    product: {
                      ...formData.product,
                      payment_provider:
                        value as CommerceProductFormData["product"]["payment_provider"],
                    },
                    prices: formData.prices.map((price) => ({
                      ...price,
                      payment_provider:
                        value as CommerceProductFormData["prices"][number]["payment_provider"],
                    })),
                  })
                }
              >
                <SelectTrigger id="payment-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-order">Sort order</Label>
              <Input
                id="sort-order"
                type="number"
                value={formData.product.sort_order}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    product: {
                      ...formData.product,
                      sort_order: parseInt(event.target.value, 10) || 0,
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short-description">Short description</Label>
            <Input
              id="short-description"
              value={formData.product.short_description ?? ""}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  product: {
                    ...formData.product,
                    short_description: event.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.product.description ?? ""}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  product: { ...formData.product, description: event.target.value },
                })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="delivery-plan">Delivery plan</Label>
              <Textarea
                id="delivery-plan"
                rows={3}
                placeholder="Download link, service handoff, template access, or manual delivery steps"
                value={metadataText(formData.product.metadata, "delivery_plan")}
                onChange={(event) =>
                  setFormData(updateMetadata(formData, "delivery_plan", event.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="launch-note">Launch note</Label>
              <Textarea
                id="launch-note"
                rows={3}
                placeholder="Internal checklist notes, test buyer, or launch risk"
                value={metadataText(formData.product.metadata, "launch_note")}
                onChange={(event) =>
                  setFormData(updateMetadata(formData, "launch_note", event.target.value))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={formData.product.image_url ?? ""}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    product: { ...formData.product, image_url: event.target.value },
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <div className="flex h-10 items-center gap-3">
                <Switch
                  id="is-featured"
                  checked={formData.product.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      product: { ...formData.product, is_featured: checked },
                    })
                  }
                />
                <Label htmlFor="is-featured">Featured</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Prices</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPrice}>
                <Plus className="mr-2 h-4 w-4" />
                Add price
              </Button>
            </div>

            {formData.prices.map((price, index) => (
              <div key={price.id ?? `new-${index}`} className="rounded-md border p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Nickname</Label>
                    <Input
                      value={price.nickname ?? ""}
                      onChange={(event) =>
                        setFormData(updatePrice(formData, index, { nickname: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lookup key</Label>
                    <Input
                      value={price.lookup_key ?? ""}
                      onChange={(event) =>
                        setFormData(updatePrice(formData, index, { lookup_key: event.target.value }))
                      }
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider price id</Label>
                    <Input
                      value={price.provider_price_id ?? ""}
                      onChange={(event) =>
                        setFormData(
                          updatePrice(formData, index, { provider_price_id: event.target.value })
                        )
                      }
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount, minor units</Label>
                    <Input
                      type="number"
                      min={0}
                      value={price.unit_amount}
                      onChange={(event) =>
                        setFormData(
                          updatePrice(formData, index, {
                            unit_amount: parseInt(event.target.value, 10) || 0,
                          })
                        )
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={price.currency}
                      maxLength={3}
                      onChange={(event) =>
                        setFormData(
                          updatePrice(formData, index, {
                            currency: event.target.value.toLowerCase(),
                          })
                        )
                      }
                      className="font-mono uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price type</Label>
                    <Select
                      value={price.price_type}
                      onValueChange={(value) =>
                        setFormData(
                          updatePrice(formData, index, {
                            price_type:
                              value as CommerceProductFormData["prices"][number]["price_type"],
                            billing_interval: value === "recurring" ? "month" : null,
                          })
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One time</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {price.price_type === "recurring" && (
                    <div className="space-y-2">
                      <Label>Billing interval</Label>
                      <Select
                        value={price.billing_interval ?? "month"}
                        onValueChange={(value) =>
                          setFormData(
                            updatePrice(formData, index, {
                              billing_interval:
                                value as CommerceProductFormData["prices"][number]["billing_interval"],
                            })
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                          <SelectItem value="year">Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={price.is_active}
                      onCheckedChange={(checked) =>
                        setFormData(updatePrice(formData, index, { is_active: checked }))
                      }
                    />
                    <span className="text-sm">Active</span>
                  </div>
                  {!price.id && formData.prices.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewPrice(index)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update product" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
