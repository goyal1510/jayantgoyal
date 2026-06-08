import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Crown,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card"
import { Separator } from "@repo/ui/separator"

import { getAuthenticatedCommerceUser } from "@/lib/commerce/api.server"
import {
  listActiveEntitlementsForUser,
  listCommerceSubscriptionsForUser,
  listPaidPurchasesWithDetailsForUser,
} from "@/lib/commerce/database.server"
import { formatCommerceInterval, formatCommercePrice } from "@/lib/commerce/format"
import { CommerceError } from "@/lib/commerce/types"

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your Jayant Tools plan, entitlements, purchases, and payment status.",
}

function formatDate(value: string | null) {
  if (!value) return "Not set"

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function AccountBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  let user

  try {
    user = await getAuthenticatedCommerceUser()
  } catch (error) {
    if (error instanceof CommerceError && error.status === 401) {
      redirect("/welcome?redirect=/account/billing")
    }

    throw error
  }

  const [{ checkout }, entitlements, subscriptions, purchases] = await Promise.all([
    searchParams,
    listActiveEntitlementsForUser(user.id),
    listCommerceSubscriptionsForUser(user.id),
    listPaidPurchasesWithDetailsForUser(user.id),
  ])
  const activeSubscription = subscriptions.find((subscription) =>
    ["active", "trialing", "past_due"].includes(subscription.status)
  )
  const planName = activeSubscription?.product?.name ?? (entitlements.length ? "Paid access" : "Free workspace")
  const planPrice = activeSubscription?.price
    ? `${formatCommercePrice(
        activeSubscription.price.unit_amount,
        activeSubscription.price.currency
      )}${formatCommerceInterval(activeSubscription.price.billing_interval)}`
    : "$0"
  const checkoutSuccess = checkout === "success"

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-8">
          <div className="space-y-5">
            {checkoutSuccess && (
              <div className="flex w-fit items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                Checkout finished. Access appears here after Razorpay payment verification.
              </div>
            )}
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit gap-1">
                <ShieldCheck className="size-3.5" />
                Account billing
              </Badge>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Plan, purchases, and paid access
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                Review the plan attached to this account, track Razorpay payments, and see the
                products that unlock premium workspace features.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/account/purchases">
                  View purchases
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/store">
                  Browse store
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Razorpay Checkout handles payment collection. Receipts and product access are mirrored into this account after server verification.
            </p>
          </div>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardDescription>Current plan</CardDescription>
              <CardTitle className="text-2xl">{planName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <span className="text-3xl font-semibold">{planPrice}</span>
                <Badge variant={activeSubscription ? "default" : "outline"}>
                  {activeSubscription ? formatStatus(activeSubscription.status) : "Free"}
                </Badge>
              </div>
              <Separator />
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Entitlements</span>
                  <span className="font-medium">{entitlements.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Purchases</span>
                  <span className="font-medium">{purchases.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Next renewal</span>
                  <span className="text-right font-medium">
                    {formatDate(activeSubscription?.current_period_end ?? null)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CreditCard className="size-5 text-sky-600 dark:text-sky-400" />
            <CardTitle className="text-lg">Razorpay payments</CardTitle>
            <CardDescription>
              Checkout is handled by Razorpay while product access stays tied to this account.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <Crown className="size-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-lg">Premium access</CardTitle>
            <CardDescription>
              Features unlock from server-verified entitlements after payment verification.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <PackageCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-lg">Digital purchases</CardTitle>
            <CardDescription>
              Paid products appear in the purchase library once the order is complete.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Subscriptions</CardTitle>
            <CardDescription>Plan and renewal states mirrored for this account.</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length ? (
              <div className="divide-y">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {subscription.product?.name ?? "Subscription product"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.price
                          ? `${formatCommercePrice(
                              subscription.price.unit_amount,
                              subscription.price.currency
                            )}${formatCommerceInterval(subscription.price.billing_interval)}`
                          : "Price not linked"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge variant="outline">{formatStatus(subscription.status)}</Badge>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarClock className="size-4" />
                        {formatDate(subscription.current_period_end)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No active subscription is linked to this account yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Active entitlements</CardTitle>
            <CardDescription>Server-side access keys currently granted to this user.</CardDescription>
          </CardHeader>
          <CardContent>
            {entitlements.length ? (
              <div className="flex flex-wrap gap-2">
                {entitlements.map((entitlement) => (
                  <Badge key={entitlement.id} variant="secondary" className="font-mono">
                    {entitlement.feature_key}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Paid feature keys will show here after checkout and webhook processing.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Recent purchases</CardTitle>
            <CardDescription>Completed one-time orders and products attached to this account.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/account/purchases">
              <ReceiptText className="size-4" />
              View all
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {purchases.length ? (
            <div className="divide-y">
              {purchases.slice(0, 4).map((purchase) => (
                <div key={purchase.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{purchase.product?.name ?? "Paid product"}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed {formatDate(purchase.completed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Badge variant="outline">{formatStatus(purchase.status)}</Badge>
                    <span className="font-medium">
                      {formatCommercePrice(purchase.amount_total, purchase.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No completed purchases yet. Store products will appear here after paid checkout.
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
