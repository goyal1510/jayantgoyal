import { NextResponse } from "next/server";
import {
  authorizeCommerceAdmin,
  commerceAdminErrorResponse,
  normalizeCommerceDeliveryPayload,
  recordCommerceAdminEvent,
} from "../../../helpers";
import type { CommerceOrder } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await params;
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
    if (!order.product_id) {
      return NextResponse.json(
        { error: "Order does not have a product attached." },
        { status: 400 }
      );
    }

    const { data, error } = await auth.client
      .from("commerce_deliveries")
      .insert({
        ...payload,
        user_id: order.user_id,
        order_id: order.id,
        product_id: order.product_id,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to create delivery" },
        { status: 500 }
      );
    }

    await recordCommerceAdminEvent({
      client: auth.client,
      eventType: "admin_delivery_created",
      adminUserId: auth.user.id,
      order: order as CommerceOrder,
      metadata: {
        delivery_id: data.id,
        delivery_type: data.delivery_type,
        status: data.status,
      },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return commerceAdminErrorResponse(error);
  }
}
