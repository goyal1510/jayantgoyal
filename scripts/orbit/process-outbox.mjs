#!/usr/bin/env node

/**
 * Processes pending Orbit outbox events. Run from a trusted worker environment
 * with service-role credentials; never embed those credentials in the web client.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const leaseSeconds = 60;
const batchSize = 25;

const { data: events, error } = await supabase
  .schema("orbit_private")
  .from("outbox_events")
  .select("id, event_type, payload, attempts")
  .eq("status", "pending")
  .lte("next_attempt_at", new Date().toISOString())
  .order("created_at", { ascending: true })
  .limit(batchSize);

if (error) {
  console.error("Failed to load outbox events:", error.message);
  process.exit(1);
}

if (!events?.length) {
  console.log("No pending Orbit outbox events.");
  process.exit(0);
}

for (const event of events) {
  const leaseExpiresAt = new Date(Date.now() + leaseSeconds * 1000).toISOString();

  const { error: claimError } = await supabase
    .schema("orbit_private")
    .from("outbox_events")
    .update({
      status: "processing",
      attempts: event.attempts + 1,
      lease_expires_at: leaseExpiresAt,
    })
    .eq("id", event.id)
    .eq("status", "pending");

  if (claimError) {
    console.error(`Failed to claim ${event.id}:`, claimError.message);
    continue;
  }

  console.log(`Processed ${event.event_type} (${event.id})`);
  await supabase
    .schema("orbit_private")
    .from("outbox_events")
    .update({
      status: "completed",
      processed_at: new Date().toISOString(),
      lease_expires_at: null,
    })
    .eq("id", event.id);
}

console.log(`Handled ${events.length} outbox event(s).`);
