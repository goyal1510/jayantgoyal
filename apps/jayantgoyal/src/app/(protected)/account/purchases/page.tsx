import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CalendarDays, Download, PackageOpen, ReceiptText } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card"

import { getAuthenticatedCommerceUser } from "@/lib/commerce/api.server"
import { listPaidPurchasesWithDetailsForUser } from "@/lib/commerce/database.server"
import { formatCommerceInterval, formatCommercePrice } from "@/lib/commerce/format"
import { CommerceError } from "@/lib/commerce/types"
import { PurchaseSupportButton } from "@/components/commerce/purchase-support-button"

export const metadata: Metadata = {
  title: "Purchases",
  description: "View completed Jayant Tools purchases and digital product access.",
}

function formatDate(value: string | null) {
  if (!value) return "Pending"

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default async function AccountPurchasesPage() {
  let user

  try {
    user = await getAuthenticatedCommerceUser()
  } catch (error) {
    if (error instanceof CommerceError && error.status === 401) {
      redirect("/welcome?redirect=/account/purchases")
    }

    throw error
  }

  const purchases = await listPaidPurchasesWithDetailsForUser(user.id)

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
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
                Completed paid products and service packages are collected here so access is
                tied to your account, not browser storage.
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

      {purchases.length ? (
        <section className="grid gap-4">
          {purchases.map((purchase) => {
            const priceLabel = purchase.price
              ? `${formatCommercePrice(
                  purchase.price.unit_amount,
                  purchase.price.currency
                )}${formatCommerceInterval(purchase.price.billing_interval)}`
              : formatCommercePrice(purchase.amount_total, purchase.currency)

            return (
              <Card key={purchase.id} className="rounded-lg shadow-none">
                <CardHeader className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="truncate text-xl">
                        {purchase.product?.name ?? "Paid product"}
                      </CardTitle>
                      <Badge variant="outline">{purchase.product?.product_type ?? "product"}</Badge>
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
                      {formatDate(purchase.completed_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-1 text-sm text-muted-foreground">
                    <span>Order ID: {purchase.id}</span>
                    <span>Status: {purchase.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {purchase.deliveries
                      .filter((delivery) => delivery.status !== "revoked")
                      .map((delivery) => (
                        <Button key={delivery.id} asChild variant="outline">
                          <Link
                            href={`/api/account/purchases/${purchase.id}/deliveries/${delivery.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="size-4" />
                            {delivery.delivery_type === "service" ? "Open delivery" : "Download"}
                          </Link>
                        </Button>
                      ))}
                    <PurchaseSupportButton
                      orderId={purchase.id}
                      productName={purchase.product?.name ?? "Paid product"}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      ) : (
        <Card className="rounded-lg border-dashed shadow-none">
          <CardHeader className="items-start gap-3">
            <PackageOpen className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <CardTitle>No purchases yet</CardTitle>
              <CardDescription>
                After a successful Razorpay checkout and server verification, paid products will
                appear here with their account-bound access state.
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
  )
}
