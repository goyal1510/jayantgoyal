import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  LifeBuoy,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
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

import { PurchaseSupportButton } from "@/components/commerce/purchase-support-button";
import { getAuthenticatedCommerceUser } from "@/lib/commerce/api.server";
import { getPaidPurchaseWithDetailsForUser } from "@/lib/commerce/database.server";
import {
  formatCommerceInterval,
  formatCommercePrice,
} from "@/lib/commerce/format";
import { CommerceError, type CommerceDelivery } from "@/lib/commerce/types";

export const metadata: Metadata = {
  title: "Purchase Details",
  description:
    "Review access, receipt, delivery, and support state for a paid purchase.",
};

function formatDateTime(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shortReference(value: string | null) {
  if (!value) return "Not set";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function deliveryLabel(delivery: CommerceDelivery) {
  const label = metadataString(delivery.metadata, "label");
  if (label) return label;
  if (delivery.delivery_type === "service") return "Service delivery";
  if (delivery.delivery_type === "manual") return "Manual delivery";
  if (delivery.delivery_type === "link") return "Open delivery";
  return "Download";
}

function canOpenDelivery(delivery: CommerceDelivery) {
  if (delivery.status !== "available" && delivery.status !== "fulfilled")
    return false;
  if (
    delivery.expires_at &&
    new Date(delivery.expires_at).getTime() <= Date.now()
  )
    return false;
  return (
    !!delivery.external_url ||
    (!!delivery.storage_bucket && !!delivery.storage_path)
  );
}

function deliverySummary(deliveries: CommerceDelivery[]) {
  if (!deliveries.length) return "No delivery has been attached yet.";
  const readyCount = deliveries.filter((delivery) =>
    canOpenDelivery(delivery),
  ).length;
  if (readyCount > 0)
    return `${readyCount} delivery item${readyCount === 1 ? "" : "s"} ready.`;
  if (deliveries.some((delivery) => delivery.status === "pending"))
    return "Delivery is being prepared.";
  return "Delivery needs support review.";
}

function deliveryActionLabel(deliveryType: CommerceDelivery["delivery_type"]) {
  if (deliveryType === "service" || deliveryType === "link") return "Open";
  return "Download";
}

function deliveryStateVariant(delivery: CommerceDelivery) {
  if (
    delivery.expires_at &&
    new Date(delivery.expires_at).getTime() <= Date.now()
  ) {
    return "outline" as const;
  }
  if (delivery.status === "available" || delivery.status === "fulfilled")
    return "default" as const;
  if (delivery.status === "pending") return "secondary" as const;
  return "outline" as const;
}

export default async function PurchaseDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  let user;

  try {
    user = await getAuthenticatedCommerceUser();
  } catch (error) {
    if (error instanceof CommerceError && error.status === 401) {
      redirect("/welcome?redirect=/account/purchases");
    }

    throw error;
  }

  const [{ orderId }, { checkout }] = await Promise.all([params, searchParams]);
  const purchase = await getPaidPurchaseWithDetailsForUser({
    orderId,
    userId: user.id,
  });

  if (!purchase) notFound();

  const priceLabel = purchase.price
    ? `${formatCommercePrice(
        purchase.price.unit_amount,
        purchase.price.currency,
      )}${formatCommerceInterval(purchase.price.billing_interval)}`
    : formatCommercePrice(purchase.amount_total, purchase.currency);
  const readyDeliveries = purchase.deliveries.filter((delivery) =>
    canOpenDelivery(delivery),
  );
  const checkoutSuccess = checkout === "success";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {checkoutSuccess ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Payment verified</p>
            <p className="mt-1">
              Your order is complete. Downloadable access and support options
              are available from this page.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/account/purchases">
            <ArrowLeft className="size-4" />
            Purchases
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/account/purchases/${purchase.id}/receipt`}>
              <FileText className="size-4" />
              Receipt
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
          <PurchaseSupportButton
            orderId={purchase.id}
            productName={purchase.product?.name ?? "Paid product"}
            orderStatus={formatStatus(purchase.status)}
            deliverySummary={deliverySummary(purchase.deliveries)}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-8">
          <div className="space-y-5">
            <Badge variant="secondary" className="w-fit gap-1">
              <ReceiptText className="size-3.5" />
              Order {shortReference(purchase.id)}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {purchase.product?.name ?? "Paid product"}
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                {purchase.product?.short_description ??
                  "Your paid product access, receipt, delivery, and support state are tied to this account."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {purchase.payment_provider}
              </Badge>
              <Badge variant="secondary">{formatStatus(purchase.status)}</Badge>
              <Badge variant={readyDeliveries.length ? "default" : "outline"}>
                {readyDeliveries.length
                  ? `${readyDeliveries.length} ready`
                  : "Delivery pending"}
              </Badge>
            </div>
          </div>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardDescription>Amount paid</CardDescription>
              <CardTitle className="text-3xl">
                {formatCommercePrice(purchase.amount_total, purchase.currency)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <DetailRow label="Price" value={priceLabel} />
              <DetailRow
                label="Completed"
                value={formatDateTime(purchase.completed_at)}
              />
              <DetailRow
                label="Provider payment"
                value={shortReference(purchase.provider_payment_id)}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-lg">Account-bound access</CardTitle>
            <CardDescription>
              This order is visible only to the buyer account that completed
              payment.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <PackageCheck className="size-5 text-sky-600 dark:text-sky-400" />
            <CardTitle className="text-lg">Delivery state</CardTitle>
            <CardDescription>
              {deliverySummary(purchase.deliveries)}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <LifeBuoy className="size-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-lg">Linked support</CardTitle>
            <CardDescription>
              Support threads opened here include product, order, and delivery
              context.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Delivery and access</CardTitle>
            <CardDescription>
              Download files, open links, or track manual delivery status from
              this order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchase.deliveries.length ? (
              <div className="grid gap-3">
                {purchase.deliveries.map((delivery) => {
                  const openable = canOpenDelivery(delivery);
                  const note = metadataString(delivery.metadata, "admin_note");

                  return (
                    <div
                      key={delivery.id}
                      className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CheckCircle2 className="size-4 text-muted-foreground" />
                          <span className="font-medium">
                            {deliveryLabel(delivery)}
                          </span>
                          <Badge variant={deliveryStateVariant(delivery)}>
                            {formatStatus(delivery.status)}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {delivery.delivery_type}
                          </Badge>
                        </div>
                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                          <span>
                            Accessed {delivery.download_count} time
                            {delivery.download_count === 1 ? "" : "s"}
                          </span>
                          <span>
                            Updated {formatDateTime(delivery.updated_at)}
                          </span>
                          {delivery.expires_at ? (
                            <span>
                              Expires {formatDateTime(delivery.expires_at)}
                            </span>
                          ) : null}
                          {note ? <span>{note}</span> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {openable ? (
                          <Button asChild variant="outline">
                            <Link
                              href={`/api/account/purchases/${purchase.id}/deliveries/${delivery.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="size-4" />
                              {deliveryActionLabel(delivery.delivery_type)}
                            </Link>
                          </Button>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-10 rounded-md px-3"
                          >
                            Not ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Delivery has not been attached yet. Open support if you expected
                access immediately.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Order record</CardTitle>
            <CardDescription>
              Provider and account reference for support.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <DetailBlock label="Order ID" value={purchase.id} mono />
            <DetailBlock
              label="Provider order"
              value={purchase.provider_order_id ?? "Not set"}
              mono
            />
            <DetailBlock
              label="Provider payment"
              value={purchase.provider_payment_id ?? "Not set"}
              mono
            />
            <DetailBlock
              label="Created"
              value={formatDateTime(purchase.created_at)}
            />
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4 text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" />
              <span>Completed {formatDateTime(purchase.completed_at)}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function DetailBlock({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "mt-1 break-all font-mono text-xs" : "mt-1"}>
        {value}
      </p>
    </div>
  );
}
