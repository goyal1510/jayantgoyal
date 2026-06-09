import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  CommerceDelivery,
  CommerceEvent,
  CommerceOrder,
  CommerceOrderOperationalDetails,
  CommercePrice,
  CommerceProduct,
} from "@/lib/types";
import { OrderDetailClient } from "./order-detail-client";

async function getOrderDetails(orderId: string): Promise<CommerceOrderOperationalDetails | null> {
  const supabase = createSupabaseAdminClient();
  const app = supabase.schema("jg_app");

  const { data: order } = await app
    .from("commerce_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const typedOrder = order as CommerceOrder;
  const [productResult, priceResult, deliveriesResult, eventsResult, buyerResult] =
    await Promise.all([
      typedOrder.product_id
        ? app.from("commerce_products").select("*").eq("id", typedOrder.product_id).maybeSingle()
        : Promise.resolve({ data: null }),
      typedOrder.price_id
        ? app.from("commerce_prices").select("*").eq("id", typedOrder.price_id).maybeSingle()
        : Promise.resolve({ data: null }),
      app
        .from("commerce_deliveries")
        .select("*")
        .eq("order_id", typedOrder.id)
        .order("created_at", { ascending: false }),
      app
        .from("commerce_events")
        .select("*")
        .eq("order_id", typedOrder.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.auth.admin.getUserById(typedOrder.user_id),
    ]);

  return {
    ...typedOrder,
    product: (productResult.data as CommerceProduct | null) ?? null,
    price: (priceResult.data as CommercePrice | null) ?? null,
    buyer_email: buyerResult.data.user?.email ?? null,
    deliveries: (deliveriesResult.data ?? []) as CommerceDelivery[],
    events: (eventsResult.data ?? []) as CommerceEvent[],
  };
}

export default async function CommerceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetails(id);

  if (!order) notFound();

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/commerce/orders">
              <ArrowLeft className="size-4" />
              Orders
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Order detail</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fulfillment, lifecycle actions, and audit history for this purchase.
          </p>
        </div>
      </div>

      <OrderDetailClient initialOrder={order} />
    </main>
  );
}
