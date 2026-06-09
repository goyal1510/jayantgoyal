import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ReceiptText } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"

import { getAuthenticatedCommerceUser } from "@/lib/commerce/api.server"
import { getPaidPurchaseWithDetailsForUser } from "@/lib/commerce/database.server"
import { formatCommerceInterval, formatCommercePrice } from "@/lib/commerce/format"
import { CommerceError } from "@/lib/commerce/types"
import { ReceiptActions } from "./receipt-actions"

export const metadata: Metadata = {
  title: "Purchase Receipt",
  description: "Printable receipt for a paid Jayant Tools order.",
}

function formatDateTime(value: string | null) {
  if (!value) return "Not set"

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function PurchaseReceiptPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  let user

  try {
    user = await getAuthenticatedCommerceUser()
  } catch (error) {
    if (error instanceof CommerceError && error.status === 401) {
      redirect("/welcome?redirect=/account/purchases")
    }

    throw error
  }

  const { orderId } = await params
  const purchase = await getPaidPurchaseWithDetailsForUser({
    orderId,
    userId: user.id,
  })

  if (!purchase) notFound()

  const priceLabel = purchase.price
    ? `${formatCommercePrice(
        purchase.price.unit_amount,
        purchase.price.currency
      )}${formatCommerceInterval(purchase.price.billing_interval)}`
    : formatCommercePrice(purchase.amount_total, purchase.currency)

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 print:max-w-none">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/account/purchases">
            <ArrowLeft className="size-4" />
            Purchases
          </Link>
        </Button>
        <ReceiptActions />
      </div>

      <Card id="receipt" className="rounded-lg shadow-none print:border-none print:shadow-none">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 w-fit gap-1">
                <ReceiptText className="size-3.5" />
                Receipt
              </Badge>
              <CardTitle className="text-3xl">Jayant Tools purchase receipt</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Account-bound proof of purchase for product access and support.
              </p>
            </div>
            <div className="text-sm sm:text-right">
              <div className="font-medium">Jayant Tools</div>
              <div className="text-muted-foreground">jayantgoyal.com</div>
              <div className="text-muted-foreground">Support through Account Purchases</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <section className="grid gap-4 md:grid-cols-2">
            <ReceiptField label="Order ID" value={purchase.id} mono />
            <ReceiptField label="Order status" value={formatStatus(purchase.status)} />
            <ReceiptField label="Completed at" value={formatDateTime(purchase.completed_at)} />
            <ReceiptField label="Payment provider" value={purchase.payment_provider} />
            <ReceiptField label="Provider order" value={purchase.provider_order_id ?? "Not set"} mono />
            <ReceiptField label="Provider payment" value={purchase.provider_payment_id ?? "Not set"} mono />
          </section>

          <section className="rounded-lg border">
            <div className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_160px_160px]">
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Product</div>
                <div className="mt-1 font-medium">{purchase.product?.name ?? "Paid product"}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {purchase.product?.short_description ?? "Paid product access"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Price</div>
                <div className="mt-1">{priceLabel}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Amount paid</div>
                <div className="mt-1 font-semibold">
                  {formatCommercePrice(purchase.amount_total, purchase.currency)}
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_160px_160px]">
              <div className="font-medium">Total</div>
              <div className="text-muted-foreground">Tax included when applicable</div>
              <div className="font-semibold">
                {formatCommercePrice(purchase.amount_total, purchase.currency)}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Delivery records</h2>
            {purchase.deliveries.length ? (
              <div className="grid gap-3">
                {purchase.deliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {delivery.delivery_type}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {delivery.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                      <span>Delivery ID: {delivery.id}</span>
                      <span>Downloads/accesses: {delivery.download_count}</span>
                      <span>Updated: {formatDateTime(delivery.updated_at)}</span>
                      {delivery.expires_at && <span>Expires: {formatDateTime(delivery.expires_at)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No delivery record has been attached to this order yet.
              </div>
            )}
          </section>

          <p className="text-xs text-muted-foreground">
            This receipt is generated from the authenticated account purchase record. For refund,
            delivery, or support questions, open support from the purchase library so the order
            context is attached automatically.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

function ReceiptField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className={mono ? "mt-1 break-all font-mono text-xs" : "mt-1"}>{value}</div>
    </div>
  )
}
