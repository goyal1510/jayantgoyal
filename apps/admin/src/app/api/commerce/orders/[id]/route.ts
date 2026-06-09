import { NextResponse } from "next/server";
import {
  authorizeCommerceAdmin,
  commerceAdminErrorResponse,
  type CommerceAdminClient,
  normalizeCommerceOrderStatusPayload,
  recordCommerceAdminEvent,
} from "../../helpers";
import type { CommerceOrder } from "@/lib/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function grantOrderAccess({
  client,
  order,
}: {
  client: CommerceAdminClient;
  order: CommerceOrder;
}) {
  if (!order.product_id || !order.price_id) return;

  const value = { source: "admin_manual_status" };
  const rows = [
    {
      user_id: order.user_id,
      product_id: order.product_id,
      price_id: order.price_id,
      order_id: order.id,
      source_type: "order",
      feature_key: `product:${order.product_id}`,
      status: "active",
      value,
      audit_reason: "Granted after admin manual paid status.",
    },
    {
      user_id: order.user_id,
      product_id: order.product_id,
      price_id: order.price_id,
      order_id: order.id,
      source_type: "order",
      feature_key: "workspace_pro",
      status: "active",
      value,
      audit_reason: "Granted after admin manual paid status.",
    },
  ];

  for (const row of rows) {
    const { data: existing, error: existingError } = await client
      .from("commerce_entitlements")
      .select("id")
      .eq("order_id", row.order_id)
      .eq("feature_key", row.feature_key)
      .limit(1);

    if (existingError) throw new Error(existingError.message);
    if (existing?.length) continue;

    const { error } = await client.from("commerce_entitlements").insert(row);
    if (error) throw new Error(error.message);
  }
}

async function revokeOrderAccess({
  client,
  orderId,
  reason,
}: {
  client: CommerceAdminClient;
  orderId: string;
  reason: string;
}) {
  const now = new Date().toISOString();

  const { error: entitlementError } = await client
    .from("commerce_entitlements")
    .update({
      status: "revoked",
      audit_reason: reason,
      updated_at: now,
    })
    .eq("order_id", orderId)
    .eq("status", "active");

  if (entitlementError) throw new Error(entitlementError.message);

  const { error: deliveryError } = await client
    .from("commerce_deliveries")
    .update({
      status: "revoked",
      updated_at: now,
    })
    .eq("order_id", orderId)
    .in("status", ["pending", "available", "fulfilled"]);

  if (deliveryError) throw new Error(deliveryError.message);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json(
        { error: "Order id is invalid." },
        { status: 400 },
      );
    }

    const payload = normalizeCommerceOrderStatusPayload(
      await request.json().catch(() => ({})),
    );
    const { data: currentOrder, error: loadError } = await auth.client
      .from("commerce_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json(
        { error: "Unable to load order." },
        { status: 500 },
      );
    }
    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const order = currentOrder as CommerceOrder;
    const nextMetadata =
      order.metadata &&
      typeof order.metadata === "object" &&
      !Array.isArray(order.metadata)
        ? order.metadata
        : {};

    const { data: updatedOrder, error: updateError } = await auth.client
      .from("commerce_orders")
      .update({
        status: payload.status,
        completed_at:
          payload.status === "paid"
            ? (order.completed_at ?? now)
            : order.completed_at,
        metadata: {
          ...nextMetadata,
          manual_status_reason: payload.reason,
          manual_status_updated_by: auth.user.id,
          manual_status_updated_at: now,
        },
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: "Unable to update order." },
        { status: 500 },
      );
    }

    const updated = updatedOrder as CommerceOrder;
    if (payload.status === "paid") {
      await grantOrderAccess({ client: auth.client, order: updated });
    }
    if (payload.status === "refunded" || payload.status === "canceled") {
      await revokeOrderAccess({
        client: auth.client,
        orderId: updated.id,
        reason: payload.reason,
      });
    }

    await recordCommerceAdminEvent({
      client: auth.client,
      eventType: "admin_order_status_updated",
      adminUserId: auth.user.id,
      order: updated,
      metadata: {
        from_status: order.status,
        to_status: payload.status,
        reason: payload.reason,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return commerceAdminErrorResponse(error);
  }
}
