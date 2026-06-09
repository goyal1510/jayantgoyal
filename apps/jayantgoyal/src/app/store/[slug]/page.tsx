import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"

import { CheckoutButton } from "@/components/commerce/checkout-button"
import { CommercePolicyLinks } from "@/components/commerce/policy-links"
import { getPublishedCommerceProductBySlug } from "@/lib/commerce/database.server"
import { trackCommerceEvent } from "@/lib/commerce/events.server"
import { formatCommerceInterval, formatCommercePrice } from "@/lib/commerce/format"

export const dynamic = "force-dynamic"

async function getProduct(slug: string) {
  try {
    return await getPublishedCommerceProductBySlug(slug)
  } catch (error) {
    console.error("Unable to load store product:", error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: "Product not found | Jayant Tools",
    }
  }

  return {
    title: `${product.name} | Jayant Tools Store`,
    description:
      product.short_description ?? product.description ?? "Jayant Tools product detail.",
    openGraph: {
      title: `${product.name} | Jayant Tools Store`,
      description:
        product.short_description ?? product.description ?? "Jayant Tools product detail.",
      images: product.image_url ? [product.image_url] : ["/assets/ProjectImages/Dark/ecommerce.png"],
    },
  }
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const primaryPrice = product.prices[0]
  trackCommerceEvent({
    eventType: "product_view",
    productId: product.id,
    priceId: primaryPrice?.id ?? null,
    source: "store_product_page",
    metadata: {
      slug: product.slug,
      productType: product.product_type,
    },
  })
  const priceLabel = primaryPrice
    ? `${formatCommercePrice(
        primaryPrice.unit_amount,
        primaryPrice.currency
      )}${formatCommerceInterval(primaryPrice.billing_interval)}`
    : "Price coming soon"

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="space-y-6">
            <Button asChild variant="ghost" className="px-0">
              <Link href="/store">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to store
              </Link>
            </Button>
            <div className="space-y-4">
              <Badge variant="outline" className="capitalize">{product.product_type}</Badge>
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
                {product.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-600">
                {product.description ?? product.short_description ?? "Product details are coming soon."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border bg-zinc-50 px-4 py-2 font-mono text-lg font-semibold">
                {priceLabel}
              </div>
              <CheckoutButton priceId={primaryPrice?.id}>
                Buy product
              </CheckoutButton>
            </div>
            <CommercePolicyLinks className="text-zinc-500" />
          </div>
          <div className="overflow-hidden rounded-lg border bg-zinc-950 shadow-xl">
            {product.image_url ? (
              <div
                role="img"
                aria-label={product.name}
                className="aspect-[4/3] w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${product.image_url})` }}
              />
            ) : (
              <Image
                src="/assets/ProjectImages/Dark/ecommerce.png"
                alt={product.name}
                width={900}
                height={675}
                className="aspect-[4/3] w-full object-cover"
              />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {[
          "Secure Razorpay checkout",
          "Purchase record in your account",
          "Delivery status in purchase library",
          "Support thread linked to the order",
        ].map((item) => (
          <div key={item} className="rounded-lg border bg-white p-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-sm font-medium">{item}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
