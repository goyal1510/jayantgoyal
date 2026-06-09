import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, LifeBuoy, PackageOpen, ReceiptText, Search } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent } from "@repo/ui/card"

import { CheckoutButton } from "@/components/commerce/checkout-button"
import { CommercePolicyLinks } from "@/components/commerce/policy-links"
import { listPublishedCommerceProducts } from "@/lib/commerce/database.server"
import { formatCommerceInterval, formatCommercePrice } from "@/lib/commerce/format"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Store | Jayant Tools",
  description:
    "Buy Jayant Tools products, templates, service packages, and workspace upgrades.",
  openGraph: {
    title: "Store | Jayant Tools",
    description:
      "Digital products, templates, service packages, and workspace upgrades for developers and creators.",
    images: ["/assets/ProjectImages/Dark/ecommerce.png"],
  },
}

const fallbackShowcase = [
  {
    title: "Developer Workspace Pro",
    image: "/assets/ProjectImages/Dark/tools.png",
    body: "Paid saved workflows, exports, and bulk utilities.",
  },
  {
    title: "File Delivery Kit",
    image: "/assets/ProjectImages/Dark/files.png",
    body: "Storage-backed downloads, purchase history, and share links.",
  },
  {
    title: "Portfolio Launch Package",
    image: "/assets/ProjectImages/Dark/ecommerce.png",
    body: "A fixed-scope commercial setup package for the portfolio.",
  },
]

const buyerFlow = [
  {
    icon: CheckCircle2,
    title: "Choose a product",
    body: "Browse published digital products, service packages, and workspace upgrades from the catalog.",
  },
  {
    icon: ReceiptText,
    title: "Pay with Razorpay",
    body: "Checkout creates an account-bound order, then server verification unlocks access after payment.",
  },
  {
    icon: LifeBuoy,
    title: "Get delivery and support",
    body: "Downloads, service links, and purchase support stay available from your account workspace.",
  },
]

async function getProducts() {
  try {
    return await listPublishedCommerceProducts()
  } catch (error) {
    console.error("Unable to load store catalog:", error)
    return []
  }
}

export default async function StorePage() {
  const products = await getProducts()

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="space-y-6">
            <Badge variant="outline" className="w-fit">Jayant Tools Store</Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
                Digital products, services, and workspace upgrades.
              </h1>
              <p className="max-w-xl text-base leading-7 text-zinc-600">
                A commercial layer for the tools hub: sell downloads, templates, support packages, and subscriptions from the same app.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/pricing">
                  Compare plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/tools">Try tools</Link>
              </Button>
            </div>
            <CommercePolicyLinks className="text-zinc-500" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {fallbackShowcase.map((item) => (
              <div key={item.title} className="overflow-hidden rounded-lg border bg-zinc-950 text-white shadow-sm">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={520}
                  height={390}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="space-y-2 p-3">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <p className="text-xs leading-5 text-zinc-300">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {buyerFlow.map((item) => (
            <div key={item.title} className="rounded-lg border border-zinc-200 p-5">
              <item.icon className="h-5 w-5 text-zinc-700" />
              <h2 className="mt-4 font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Catalog</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Published commerce products appear here as soon as they are added.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-zinc-500">
            <Search className="h-4 w-4" />
            Catalog-backed storefront
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const primaryPrice = product.prices[0]
              const priceLabel = primaryPrice
                ? `${formatCommercePrice(
                    primaryPrice.unit_amount,
                    primaryPrice.currency
                  )}${formatCommerceInterval(primaryPrice.billing_interval)}`
                : "Price coming soon"

              return (
                <Card key={product.id} className="overflow-hidden rounded-lg">
                  {product.image_url && (
                    <div
                      role="img"
                      aria-label={product.name}
                      className="aspect-[16/9] w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${product.image_url})` }}
                    />
                  )}
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge variant="secondary" className="mb-3 capitalize">
                          {product.product_type}
                        </Badge>
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                      </div>
                      <div className="shrink-0 font-mono text-sm font-semibold">
                        {priceLabel}
                      </div>
                    </div>
                    <p className="min-h-12 text-sm leading-6 text-zinc-600">
                      {product.short_description ?? product.description ?? "Product details are coming soon."}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button asChild variant="outline">
                        <Link href={`/store/${product.slug}`}>Details</Link>
                      </Button>
                      <CheckoutButton priceId={primaryPrice?.id}>
                        Buy
                      </CheckoutButton>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center">
            <PackageOpen className="mx-auto h-10 w-10 text-zinc-500" />
            <h3 className="mt-4 text-lg font-semibold">Storefront is ready for products</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
              The commerce schema and API are wired. Add published products and active prices in the admin commerce phase to start selling.
            </p>
            <Button asChild className="mt-5">
              <Link href="/pricing">View pricing plan</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
