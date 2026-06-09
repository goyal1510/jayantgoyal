import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoneyMinor, shortId } from "@/lib/commerce-format";
import type {
  CommerceOrder,
  CommerceOrderWithDetails,
  CommercePrice,
  CommerceProduct,
} from "@/lib/types";

async function getOrders(): Promise<CommerceOrderWithDetails[]> {
  const supabase = createSupabaseAdminClient();
  const app = supabase.schema("jg_app");

  const { data: orders } = await app
    .from("commerce_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!orders?.length) return [];

  const typedOrders = orders as CommerceOrder[];
  const productIds = [...new Set(typedOrders.map((order) => order.product_id).filter(Boolean))] as string[];
  const priceIds = [...new Set(typedOrders.map((order) => order.price_id).filter(Boolean))] as string[];
  const userIds = [...new Set(typedOrders.map((order) => order.user_id))];

  const [{ data: products }, { data: prices }, buyerEntries] = await Promise.all([
    productIds.length
      ? app.from("commerce_products").select("*").in("id", productIds)
      : Promise.resolve({ data: [] }),
    priceIds.length
      ? app.from("commerce_prices").select("*").in("id", priceIds)
      : Promise.resolve({ data: [] }),
    Promise.all(
      userIds.map(async (userId) => {
        const { data } = await supabase.auth.admin.getUserById(userId);
        return [userId, data.user?.email ?? null] as const;
      })
    ),
  ]);

  const productsById = new Map(
    ((products ?? []) as CommerceProduct[]).map((product) => [product.id, product])
  );
  const pricesById = new Map(
    ((prices ?? []) as CommercePrice[]).map((price) => [price.id, price])
  );
  const buyersById = new Map(buyerEntries);

  return typedOrders.map((order) => ({
    ...order,
    product: order.product_id ? productsById.get(order.product_id) ?? null : null,
    price: order.price_id ? pricesById.get(order.price_id) ?? null : null,
    buyer_email: buyersById.get(order.user_id) ?? null,
  }));
}

function statusVariant(status: CommerceOrder["status"]) {
  if (status === "paid") return "default";
  if (status === "pending") return "secondary";
  return "outline";
}

export default async function CommerceOrdersPage() {
  const orders = await getOrders();
  const paidCount = orders.filter((order) => order.status === "paid").length;
  const pendingCount = orders.filter((order) => order.status === "pending").length;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commerce orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last {orders.length} orders, {paidCount} paid, {pendingCount} pending.
        </p>
      </div>

      <div className="rounded-lg border">
        {orders.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium">No commerce orders yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Checkout attempts and paid purchases will appear here.
            </p>
          </div>
        ) : (
          orders.map((order, index) => (
            <div
              key={order.id}
              className={`grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_190px_150px_170px_160px_110px] ${
                index !== orders.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-medium">{shortId(order.id)}</p>
                  <Badge variant={statusVariant(order.status)} className="capitalize">
                    {order.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {order.payment_provider}
                  </Badge>
                </div>
                <p className="mt-2 truncate text-sm">
                  {order.product?.name ?? "Product removed"}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {order.buyer_email ?? shortId(order.user_id)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Amount</p>
                <p className="mt-1 text-sm font-medium">
                  {formatMoneyMinor(order.amount_total, order.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.price?.lookup_key ?? order.price?.nickname ?? "No price key"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Provider order</p>
                <p className="mt-1 font-mono text-sm">{shortId(order.provider_order_id)}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Provider payment</p>
                <p className="mt-1 font-mono text-sm">{shortId(order.provider_payment_id)}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Created</p>
                <p className="mt-1 text-sm">{formatDateTime(order.created_at)}</p>
              </div>

              <div className="flex items-start xl:justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/commerce/orders/${order.id}`}>Open</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
