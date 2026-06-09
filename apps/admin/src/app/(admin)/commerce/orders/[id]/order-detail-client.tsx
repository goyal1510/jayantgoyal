"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Loader2,
  PackageCheck,
  RotateCcw,
  Search,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import { formatDateTime, formatMoneyMinor, shortId } from "@/lib/commerce-format";
import type {
  CommerceDelivery,
  CommerceDeliveryStatus,
  CommerceDeliveryType,
  CommerceOrderOperationalDetails,
  CommerceOrderStatus,
} from "@/lib/types";

const ORDER_STATUSES: CommerceOrderStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "canceled",
  "expired",
];
const DELIVERY_TYPES: CommerceDeliveryType[] = ["download", "link", "manual", "service"];
const DELIVERY_STATUSES: CommerceDeliveryStatus[] = [
  "pending",
  "available",
  "fulfilled",
  "revoked",
];

type DeliveryForm = {
  id?: string;
  label: string;
  delivery_type: CommerceDeliveryType;
  status: CommerceDeliveryStatus;
  external_url: string;
  storage_bucket: string;
  storage_path: string;
  expires_at: string;
  admin_note: string;
};

type DeliveryFile = {
  id: string;
  bucket_id: string;
  storage_path: string;
  display_name: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  mime_type: string | null;
  size_bytes: number;
  updated_at: string;
};

function emptyDeliveryForm(): DeliveryForm {
  return {
    label: "",
    delivery_type: "link",
    status: "available",
    external_url: "",
    storage_bucket: "",
    storage_path: "",
    expires_at: "",
    admin_note: "",
  };
}

function deliveryToForm(delivery: CommerceDelivery): DeliveryForm {
  const metadata = delivery.metadata ?? {};
  return {
    id: delivery.id,
    label: typeof metadata.label === "string" ? metadata.label : "",
    delivery_type: delivery.delivery_type,
    status: delivery.status,
    external_url: delivery.external_url ?? "",
    storage_bucket: delivery.storage_bucket ?? "",
    storage_path: delivery.storage_path ?? "",
    expires_at: delivery.expires_at ? delivery.expires_at.slice(0, 16) : "",
    admin_note: typeof metadata.admin_note === "string" ? metadata.admin_note : "",
  };
}

function statusVariant(status: CommerceOrderStatus | CommerceDeliveryStatus) {
  if (status === "paid" || status === "available" || status === "fulfilled") return "default";
  if (status === "pending") return "secondary";
  if (status === "refunded" || status === "canceled" || status === "revoked") return "destructive";
  return "outline";
}

function metadataLabel(delivery: CommerceDelivery) {
  const label = delivery.metadata?.label;
  return typeof label === "string" && label.trim() ? label : "Delivery";
}

function fileLabel(file: DeliveryFile) {
  return file.display_name?.trim() || file.file_name || "Untitled file";
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function OrderDetailClient({
  initialOrder,
}: {
  initialOrder: CommerceOrderOperationalDetails;
}) {
  const router = useRouter();
  const [order, setOrder] = React.useState(initialOrder);
  const [status, setStatus] = React.useState<CommerceOrderStatus>(initialOrder.status);
  const [reason, setReason] = React.useState("");
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [deliveryForm, setDeliveryForm] = React.useState<DeliveryForm>(() => emptyDeliveryForm());
  const [savingDelivery, setSavingDelivery] = React.useState(false);
  const [fileSearch, setFileSearch] = React.useState("");
  const [deliveryFiles, setDeliveryFiles] = React.useState<DeliveryFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(false);
  const [filePickerMessage, setFilePickerMessage] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const loadDeliveryFiles = React.useCallback(async () => {
    setLoadingFiles(true);
    setFilePickerMessage(null);

    try {
      const response = await fetch(
        `/api/commerce/orders/${order.id}/delivery-files?q=${encodeURIComponent(fileSearch)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load buyer files");
      }

      const files = (payload.files ?? []) as DeliveryFile[];
      setDeliveryFiles(files);
      setFilePickerMessage(files.length ? null : "No uploaded buyer files matched this search.");
    } catch (error) {
      setDeliveryFiles([]);
      setFilePickerMessage(error instanceof Error ? error.message : "Unable to load buyer files");
    } finally {
      setLoadingFiles(false);
    }
  }, [fileSearch, order.id]);

  const applyDeliveryFile = React.useCallback((file: DeliveryFile) => {
    setDeliveryForm((current) => ({
      ...current,
      label: current.label || fileLabel(file),
      delivery_type: "download",
      status: current.status === "pending" ? "available" : current.status,
      external_url: "",
      storage_bucket: file.bucket_id,
      storage_path: file.storage_path,
    }));
    toast.success("Buyer file attached to delivery");
  }, []);

  const handleStatusSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingStatus(true);

    try {
      const response = await fetch(`/api/commerce/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update order status");
      }

      setOrder((current) => ({ ...current, ...payload.data }));
      setReason("");
      toast.success("Order status updated");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update order status");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeliverySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingDelivery(true);

    try {
      const isEdit = !!deliveryForm.id;
      const response = await fetch(
        isEdit
          ? `/api/commerce/orders/${order.id}/deliveries/${deliveryForm.id}`
          : `/api/commerce/orders/${order.id}/deliveries`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deliveryForm),
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save delivery");
      }

      setDeliveryForm(emptyDeliveryForm());
      toast.success(isEdit ? "Delivery updated" : "Delivery created");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save delivery");
    } finally {
      setSavingDelivery(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-6">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{shortId(order.id)}</span>
                  <Badge variant={statusVariant(order.status)} className="capitalize">
                    {order.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {order.payment_provider}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {order.product?.name ?? "Product removed"} ·{" "}
                  {order.buyer_email ?? shortId(order.user_id)}
                </CardDescription>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-semibold">
                  {formatMoneyMinor(order.amount_total, order.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.price?.lookup_key ?? order.price?.nickname ?? "No price key"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Detail label="Buyer" value={order.buyer_email ?? order.user_id} />
            <Detail label="Provider order" value={shortId(order.provider_order_id)} />
            <Detail label="Provider payment" value={shortId(order.provider_payment_id)} />
            <Detail label="Created" value={formatDateTime(order.created_at)} />
            <Detail label="Completed" value={formatDateTime(order.completed_at)} />
            <Detail label="Updated" value={formatDateTime(order.updated_at)} />
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle>Deliveries</CardTitle>
            <CardDescription>
              Delivery rows control what buyers can open from their purchase library.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.deliveries.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No deliveries yet. Create a link, file path, manual, or service delivery.
              </div>
            ) : (
              order.deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="grid gap-3 rounded-md border p-4 lg:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{metadataLabel(delivery)}</p>
                      <Badge variant={statusVariant(delivery.status)} className="capitalize">
                        {delivery.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {delivery.delivery_type}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                      <span>Downloads: {delivery.download_count}</span>
                      <span>Expires: {formatDateTime(delivery.expires_at)}</span>
                      {delivery.external_url && (
                        <span className="truncate">URL: {delivery.external_url}</span>
                      )}
                      {delivery.storage_path && (
                        <span className="truncate">
                          Storage: {delivery.storage_bucket}/{delivery.storage_path}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                    {delivery.external_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={delivery.external_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" />
                          Open
                        </a>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeliveryForm(deliveryToForm(delivery))}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle>Audit history</CardTitle>
            <CardDescription>Recent commerce events for this order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.events.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No audit events recorded yet.
              </div>
            ) : (
              order.events.map((event) => (
                <div key={event.id} className="flex gap-3 rounded-md border p-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{event.event_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(event.created_at)} · {event.source}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="flex flex-col gap-6">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle>Lifecycle action</CardTitle>
            <CardDescription>
              Records a manual status change. Provider refunds are not processed here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleStatusSubmit}>
              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as CommerceOrderStatus)}>
                  <SelectTrigger id="order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((item) => (
                      <SelectItem key={item} value={item} className="capitalize">
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-reason">Reason</Label>
                <Textarea
                  id="status-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why is this status changing?"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={savingStatus}>
                {savingStatus ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Record status
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle>{deliveryForm.id ? "Edit delivery" : "Create delivery"}</CardTitle>
            <CardDescription>
              Use external URLs for links/services or storage bucket/path for private downloads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleDeliverySubmit}>
              <div className="space-y-2">
                <Label htmlFor="delivery-label">Label</Label>
                <Input
                  id="delivery-label"
                  value={deliveryForm.label}
                  onChange={(event) =>
                    setDeliveryForm((current) => ({ ...current, label: event.target.value }))
                  }
                  placeholder="Starter pass files"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delivery-type">Type</Label>
                  <Select
                    value={deliveryForm.delivery_type}
                    onValueChange={(value) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        delivery_type: value as CommerceDeliveryType,
                      }))
                    }
                  >
                    <SelectTrigger id="delivery-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_TYPES.map((item) => (
                        <SelectItem key={item} value={item} className="capitalize">
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-status">Status</Label>
                  <Select
                    value={deliveryForm.status}
                    onValueChange={(value) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        status: value as CommerceDeliveryStatus,
                      }))
                    }
                  >
                    <SelectTrigger id="delivery-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_STATUSES.map((item) => (
                        <SelectItem key={item} value={item} className="capitalize">
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-url">External URL</Label>
                <Input
                  id="delivery-url"
                  value={deliveryForm.external_url}
                  onChange={(event) =>
                    setDeliveryForm((current) => ({ ...current, external_url: event.target.value }))
                  }
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Buyer file manager</p>
                    <p className="text-xs text-muted-foreground">
                      Search uploaded files owned by this order buyer and attach one as a private download.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={fileSearch}
                    onChange={(event) => setFileSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void loadDeliveryFiles();
                      }
                    }}
                    placeholder="Search buyer files"
                    aria-label="Search buyer files"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadDeliveryFiles()}
                    disabled={loadingFiles}
                    aria-label="Search buyer file manager"
                  >
                    {loadingFiles ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {deliveryFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => applyDeliveryFile(file)}
                      className="flex w-full min-w-0 items-start justify-between gap-3 rounded-md border bg-background p-3 text-left text-sm transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{fileLabel(file)}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {file.file_path} · {formatFileSize(file.size_bytes)} · {file.file_type}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-primary">Attach</span>
                    </button>
                  ))}
                  {filePickerMessage && (
                    <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      {filePickerMessage}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storage-bucket">Storage bucket</Label>
                  <Input
                    id="storage-bucket"
                    value={deliveryForm.storage_bucket}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        storage_bucket: event.target.value,
                      }))
                    }
                    placeholder="commerce-deliveries"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage-path">Storage path</Label>
                  <Input
                    id="storage-path"
                    value={deliveryForm.storage_path}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({ ...current, storage_path: event.target.value }))
                    }
                    placeholder="orders/file.zip"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-expires">Expires at</Label>
                <Input
                  id="delivery-expires"
                  type="datetime-local"
                  value={deliveryForm.expires_at}
                  onChange={(event) =>
                    setDeliveryForm((current) => ({ ...current, expires_at: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-note">Admin note</Label>
                <Textarea
                  id="delivery-note"
                  value={deliveryForm.admin_note}
                  onChange={(event) =>
                    setDeliveryForm((current) => ({ ...current, admin_note: event.target.value }))
                  }
                  placeholder="Internal note about this delivery"
                />
              </div>
              <div className="flex gap-2">
                {deliveryForm.id && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeliveryForm(emptyDeliveryForm())}
                  >
                    Reset
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={savingDelivery}>
                  {savingDelivery ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <PackageCheck className="size-4" />
                  )}
                  {deliveryForm.id ? "Update delivery" : "Create delivery"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}
