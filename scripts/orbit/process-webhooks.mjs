#!/usr/bin/env node

import { createDatabaseBoundaryHttp, databaseAuthHeaders } from "../lib/database-boundary-http.mjs";
import { postWebhookDelivery } from "./lib/webhook-delivery.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { expectStatus, request } = createDatabaseBoundaryHttp(supabaseUrl);
const headers = {
  ...databaseAuthHeaders(serviceRoleKey, "orbit"),
  "content-type": "application/json",
};

const claimResponse = await request("/rest/v1/rpc/claim_webhook_deliveries", {
  method: "POST",
  headers,
  body: JSON.stringify({ p_limit: 25 }),
});

const deliveries = await expectStatus(claimResponse, [200], "orbit.claim_webhook_deliveries");
const rows = Array.isArray(deliveries) ? deliveries : [];

if (!rows.length) {
  console.log("No pending Orbit webhook deliveries.");
  process.exit(0);
}

let completed = 0;

for (const delivery of rows) {
  const deliveryId = delivery.id;
  try {
    const status = await postWebhookDelivery({
      url: delivery.url,
      signingSecret: delivery.signing_secret,
      eventType: delivery.event_type,
      payload: delivery.payload,
      deliveryId,
    });

    const finalizeResponse = await request("/rest/v1/rpc/finalize_webhook_delivery", {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_delivery_id: deliveryId,
        p_success: true,
        p_http_status: status,
        p_error: null,
      }),
    });
    await expectStatus(finalizeResponse, [200, 204], "orbit.finalize_webhook_delivery");
    completed += 1;
    console.log(`Delivered ${delivery.event_type} (${deliveryId})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed ${delivery.event_type} (${deliveryId}):`, message);
    const finalizeResponse = await request("/rest/v1/rpc/finalize_webhook_delivery", {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_delivery_id: deliveryId,
        p_success: false,
        p_http_status: null,
        p_error: message,
      }),
    });
    await expectStatus(finalizeResponse, [200, 204], "orbit.finalize_webhook_delivery");
  }
}

console.log(`Completed ${completed}/${rows.length} webhook delivery(ies).`);
