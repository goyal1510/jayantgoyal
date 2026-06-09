import { NextResponse } from "next/server";
import {
  authorizeCommerceAdmin,
  commerceAdminErrorResponse,
  normalizeCommerceDeliveryPayload,
  recordCommerceAdminEvent,
} from "../../../../helpers";
import type { CommerceOrder } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const { id, deliveryId } = await params;
    const payload = normalizeCommerceDeliveryPayload(await request.json().catch(() => ({})));
    const { data: order, error: orderError } = await auth.client
      .from("commerce_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data, error } = await auth.client
      .from("commerce_deliveries")
      .update(payload)
      .eq("id", deliveryId)
      .eq("order_id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to update delivery" },
        { status: 500 }
      );
    }

    await recordCommerceAdminEvent({
      client: auth.client,
      eventType: "admin_delivery_updated",
      adminUserId: auth.user.id,
      order: order as CommerceOrder,
      metadata: {
        delivery_id: data.id,
        delivery_type: data.delivery_type,
        status: data.status,
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return commerceAdminErrorResponse(error);
  }
}
