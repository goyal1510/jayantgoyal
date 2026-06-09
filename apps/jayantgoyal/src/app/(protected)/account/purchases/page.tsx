import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  PackageOpen,
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

import { getAuthenticatedCommerceUser } from "@/lib/commerce/api.server";
import { listPaidPurchasesWithDetailsForUser } from "@/lib/commerce/database.server";
import {
  formatCommerceInterval,
  formatCommercePrice,
} from "@/lib/commerce/format";
import { CommerceError } from "@/lib/commerce/types";
import { PurchaseSupportButton } from "@/components/commerce/purchase-support-button";

export const metadata: Metadata = {
  title: "Purchases",
  description:
    "View completed Jayant Tools purchases and digital product access.",
};

function formatDate(value: string | null) {
  if (!value) return "Pending";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

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
  if (!value) return null;
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function deliveryLabel(delivery: {
  delivery_type: string;
  metadata: Record<string, unknown>;
}) {
  const label = delivery.metadata?.label;
  if (typeof label === "string" && label.trim()) return label;
  if (delivery.delivery_type === "service") return "Service delivery";
  if (delivery.delivery_type === "manual") return "Manual delivery";
  if (delivery.delivery_type === "link") return "Open delivery";
  return "Download";
}

function deliveryStateLabel(delivery: {
  status: string;
  expires_at: string | null;
}) {
  if (
    delivery.expires_at &&
    new Date(delivery.expires_at).getTime() <= Date.now()
  ) {
    return "Expired";
  }
  return formatStatus(delivery.status);
}

function deliveryStateVariant(delivery: {
  status: string;
  expires_at: string | null;
}) {
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

function deliveryVersion(delivery: {
  metadata: Record<string, unknown>;
  updated_at: string;
}) {
  return (
    metadataString(delivery.metadata, "version") ??
    metadataString(delivery.metadata, "release") ??
    `Updated ${formatDate(delivery.updated_at)}`
  );
}

function deliveryActionLabel(deliveryType: string) {
  if (deliveryType === "service" || deliveryType === "link") return "Open";
  return "Download";
}

function canOpenDelivery(delivery: {
  status: string;
  external_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  expires_at: string | null;
}) {
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

function deliverySummary(
  deliveries: Array<{ status: string; expires_at: string | null }>,
) {
  if (!deliveries.length) return "No delivery has been attached yet.";
  const readyCount = deliveries.filter(
    (delivery) =>
      (delivery.status === "available" || delivery.status === "fulfilled") &&
      (!delivery.expires_at ||
        new Date(delivery.expires_at).getTime() > Date.now()),
  ).length;
  if (readyCount > 0)
    return `${readyCount} delivery item${readyCount === 1 ? "" : "s"} ready.`;
  if (deliveries.some((delivery) => delivery.status === "pending"))
    return "Delivery is being prepared.";
  return "Delivery needs support review.";
}

export default async function AccountPurchasesPage({
  searchParams,
}: {
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

  const [{ checkout }, purchases] = await Promise.all([
    searchParams,
    listPaidPurchasesWithDetailsForUser(user.id),
  ]);
  const checkoutSuccess = checkout === "success";
  const totalSpent = purchases.reduce<Record<string, number>>(
    (acc, purchase) => {
      acc[purchase.currency] =
        (acc[purchase.currency] ?? 0) + purchase.amount_total;
      return acc;
    },
    {},
  );
  const primarySpend = Object.entries(totalSpent).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const readyDeliveryCount = purchases.reduce(
    (count, purchase) =>
      count +
      purchase.deliveries.filter((delivery) => canOpenDelivery(delivery))
        .length,
    0,
  );
  const supportReadyCount = purchases.filter(
    (purchase) => purchase.deliveries.length === 0,
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {checkoutSuccess ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Payment verified</p>
            <p className="mt-1">
              Your purchase library has been refreshed. Open the latest order
              for delivery and support details.
            </p>
          </div>
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit gap-1">
              <ReceiptText className="size-3.5" />
              Purchase library
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Products you own
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                Completed paid products and service packages are collected here
                so access is tied to your account, not browser storage.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/account/billing">Billing</Link>
            </Button>
            <Button asChild>
              <Link href="/store">
                Browse store
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <ReceiptText className="size-5 text-sky-600 dark:text-sky-400" />
            <CardTitle className="text-lg">Paid orders</CardTitle>
            <CardDescription>
              {purchases.length} completed purchase
              {purchases.length === 1 ? "" : "s"}.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <Download className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-lg">Ready delivery</CardTitle>
            <CardDescription>
              {readyDeliveryCount} download or access item
              {readyDeliveryCount === 1 ? "" : "s"} available.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-lg">Support watch</CardTitle>
            <CardDescription>
              {supportReadyCount} order{supportReadyCount === 1 ? "" : "s"}{" "}
              waiting on first delivery.{" "}
              {primarySpend
                ? `${formatCommercePrice(primarySpend[1], primarySpend[0])} total paid.`
                : "$0 total paid."}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {purchases.length ? (
        <section className="grid gap-4">
          {purchases.map((purchase) => {
            const priceLabel = purchase.price
              ? `${formatCommercePrice(
                  purchase.price.unit_amount,
                  purchase.price.currency,
                )}${formatCommerceInterval(purchase.price.billing_interval)}`
              : formatCommercePrice(purchase.amount_total, purchase.currency);

            return (
              <Card
                key={purchase.id}
                className="overflow-hidden rounded-lg shadow-none"
              >
                <CardHeader className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="truncate text-xl">
                        {purchase.product?.name ?? "Paid product"}
                      </CardTitle>
                      <Badge variant="outline">
                        {purchase.product?.product_type ?? "product"}
                      </Badge>
                      <Badge variant="secondary">
                        {formatStatus(purchase.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {purchase.product?.short_description ??
                        "This purchase is linked to your account and ready for delivery setup."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 text-left lg:text-right">
                    <span className="text-2xl font-semibold">{priceLabel}</span>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground lg:justify-end">
                      <CalendarDays className="size-4" />
                      {formatDateTime(purchase.completed_at)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm md:grid-cols-3">
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Order
                      </div>
                      <div className="mt-1 break-all font-mono text-xs">
                        {purchase.id}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Provider
                      </div>
                      <div className="mt-1 capitalize">
                        {purchase.payment_provider}
                        {purchase.provider_payment_id
                          ? ` · ${shortReference(purchase.provider_payment_id)}`
                          : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Access
                      </div>
                      <div className="mt-1">
                        {deliverySummary(purchase.deliveries)}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 text-muted-foreground" />
                      <h2 className="text-sm font-medium">Delivery status</h2>
                    </div>
                    {purchase.deliveries.length ? (
                      <div className="grid gap-3">
                        {purchase.deliveries.map((delivery) => {
                          const openable = canOpenDelivery(delivery);
                          const note = metadataString(
                            delivery.metadata,
                            "admin_note",
                          );
                          return (
                            <div
                              key={delivery.id}
                              className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <CheckCircle2 className="size-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {deliveryLabel(delivery)}
                                  </span>
                                  <Badge
                                    variant={deliveryStateVariant(delivery)}
                                  >
                                    {deliveryStateLabel(delivery)}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {delivery.delivery_type}
                                  </Badge>
                                </div>
                                <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                                  <span>{deliveryVersion(delivery)}</span>
                                  <span>
                                    Accessed {delivery.download_count} time
                                    {delivery.download_count === 1 ? "" : "s"}
                                    {delivery.expires_at
                                      ? ` · Expires ${formatDateTime(delivery.expires_at)}`
                                      : ""}
                                  </span>
                                  {note && <span>{note}</span>}
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
                                      {deliveryActionLabel(
                                        delivery.delivery_type,
                                      )}
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
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Delivery has not been attached yet. Open support if you
                        expected access immediately.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Button asChild>
                      <Link href={`/account/purchases/${purchase.id}`}>
                        <ReceiptText className="size-4" />
                        Details
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link
                        href={`/account/purchases/${purchase.id}/receipt`}
                        target="_blank"
                      >
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
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="rounded-lg border-dashed shadow-none">
          <CardHeader className="items-start gap-3">
            <PackageOpen className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <CardTitle>No purchases yet</CardTitle>
              <CardDescription>
                After a successful Razorpay checkout and server verification,
                paid products will appear here with their account-bound access
                state.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/store">
                Explore products
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
