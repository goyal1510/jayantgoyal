import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Files, LifeBuoy, Sparkles, Wrench } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"

import { CheckoutButton } from "@/components/commerce/checkout-button"
import { CommercePolicyLinks } from "@/components/commerce/policy-links"
import { listPublishedCommerceProducts } from "@/lib/commerce/database.server"
import { formatCommerceInterval, formatCommercePrice } from "@/lib/commerce/format"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pricing | Jayant Tools",
  description:
    "Choose a Jayant Tools plan for developer utilities, file workflows, premium calculators, product downloads, and support.",
  openGraph: {
    title: "Pricing | Jayant Tools",
    description:
      "Developer utilities, file workflows, premium calculators, product downloads, and support in one workspace.",
    images: ["/assets/ProjectImages/Dark/tools.png"],
  },
}

const included = [
  "99+ developer utilities",
  "Private file workspace",
  "Calculators, games, and productivity tools",
  "Purchase history and account billing",
]

const proFeatures = [
  "Saved tool history and favorites",
  "Bulk utilities and exports",
  "Larger file storage and share links",
  "Premium templates and workspace upgrades",
  "Buyer support through messenger",
]

const launchChecklist = [
  "Product and price created in admin",
  "Razorpay order created at checkout",
  "Webhook or verification marks order paid",
  "Entitlements and delivery rows appear in account",
  "Purchase support routes into Messenger",
]

async function getSubscriptionPrice() {
  try {
    const products = await listPublishedCommerceProducts()
    const subscriptionProduct = products.find(
      (product) => product.product_type === "subscription"
    )
    const price = subscriptionProduct?.prices.find((item) => item.price_type === "one_time")

    if (!subscriptionProduct || !price) return null

    return {
      product: subscriptionProduct,
      price,
    }
  } catch (error) {
    console.error("Unable to load pricing catalog:", error)
    return null
  }
}

export default async function PricingPage() {
  const paidPlan = await getSubscriptionPrice()
  const paidLabel = paidPlan
    ? `${formatCommercePrice(
        paidPlan.price.unit_amount,
        paidPlan.price.currency
      )}${formatCommerceInterval(paidPlan.price.billing_interval)}`
    : "Razorpay plan coming soon"

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.22),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(245,158,11,0.18),transparent_30%),linear-gradient(135deg,#09090b_0%,#18181b_48%,#0f172a_100%)]">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div className="max-w-2xl space-y-6">
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
              Jayant Tools pricing
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-6xl">
                Sellable workspace, not just a portfolio.
              </h1>
              <p className="max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                Start free, then upgrade for saved workflows, storage, product downloads, and direct support.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200">
                <Link href="/store">
                  View store
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/tools">Try free tools</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Image
              src="/assets/ProjectImages/Dark/tools.png"
              alt="Developer tools workspace"
              width={900}
              height={675}
              className="aspect-[4/3] rounded-lg border border-white/10 object-cover shadow-2xl shadow-black/40"
            />
            <div className="grid gap-4">
              <Image
                src="/assets/ProjectImages/Dark/files.png"
                alt="File manager workspace"
                width={640}
                height={400}
                className="aspect-[16/10] rounded-lg border border-white/10 object-cover shadow-2xl shadow-black/30"
              />
              <Image
                src="/assets/ProjectImages/Dark/calculator.png"
                alt="Calculator workspace"
                width={640}
                height={400}
                className="aspect-[16/10] rounded-lg border border-white/10 object-cover shadow-2xl shadow-black/30"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-4 py-12 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <Card className="rounded-lg border-zinc-200 shadow-sm">
            <CardHeader>
              <Badge variant="outline" className="w-fit">Free</Badge>
              <CardTitle className="text-2xl">Explore</CardTitle>
              <div className="text-3xl font-semibold">$0</div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3 text-sm text-zinc-700">
                {included.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/welcome">Create account</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-950 shadow-xl shadow-zinc-950/10">
            <CardHeader>
              <Badge className="w-fit bg-zinc-950 text-white hover:bg-zinc-950">Pro</Badge>
              <CardTitle className="text-2xl">Workspace</CardTitle>
              <div className="text-3xl font-semibold">{paidLabel}</div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3 text-sm text-zinc-700">
                {proFeatures.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <CheckoutButton
                priceId={paidPlan?.price.id}
                className="w-full"
              >
                Upgrade to Pro
              </CheckoutButton>
              <CommercePolicyLinks />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-200 shadow-sm">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Services</Badge>
              <CardTitle className="text-2xl">Done-with-you</CardTitle>
              <div className="text-3xl font-semibold">Fixed scope</div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3 text-sm text-zinc-700">
                {[
                  "Portfolio setup package",
                  "Supabase/Next.js implementation help",
                  "Code review and launch readiness",
                  "Custom tool or dashboard build",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/store">Browse packages</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-white px-4 py-12 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {[
            { icon: Wrench, title: "Tools", body: "Fast utilities with saved workflows coming next." },
            { icon: Files, title: "Files", body: "Storage, sharing, and delivery for paid products." },
            { icon: Sparkles, title: "Templates", body: "Sell reusable kits without rebuilding the app." },
            { icon: LifeBuoy, title: "Support", body: "Buyer help routes into messenger and admin." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-zinc-200 p-4">
              <item.icon className="h-5 w-5 text-zinc-700" />
              <h2 className="mt-4 font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-zinc-50 px-4 py-12 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline" className="mb-4">Launch readiness</Badge>
            <h2 className="text-2xl font-semibold">What paid access means here</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              The paid layer is account-bound: purchases, deliveries, support, and feature access
              all stay connected to the logged-in user instead of one-off browser state.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {launchChecklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border bg-white p-4 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
