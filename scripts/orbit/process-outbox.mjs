#!/usr/bin/env node

/**
 * Processes pending Orbit outbox events. Run from a trusted worker environment
 * with service-role credentials; never embed those credentials in the web client.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const orbitOrigin =
  process.env.NEXT_PUBLIC_ORBIT_URL?.replace(/\/$/, "") ??
  "https://orbit.jayantgoyal.com";
const inviteFrom =
  process.env.ORBIT_INVITE_FROM ?? "Orbit <onboarding@resend.dev>";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const leaseSeconds = 60;
const batchSize = 25;

async function sendInvitationEmail({ email, workspaceName, inviteUrl }) {
  if (!resendApiKey) {
    console.log(`Skipping email to ${email}; RESEND_API_KEY is not configured.`);
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: inviteFrom,
      to: [email],
      subject: `Join ${workspaceName} on Orbit`,
      text: [
        `You have been invited to join ${workspaceName} on Orbit.`,
        "",
        `Accept the invitation: ${inviteUrl}`,
        "",
        "This link expires in seven days.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed (${response.status}): ${body}`);
  }

  return { skipped: false };
}

async function handleInvitationCreated(payload) {
  const invitationId = payload?.invitation_id;
  if (!invitationId) {
    throw new Error("invitation.created payload missing invitation_id");
  }

  const { data: invitation, error: invitationError } = await supabase
    .schema("orbit_private")
    .from("invitations")
    .select("email_normalized, token_hash, workspace_id, status")
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError) {
    throw invitationError;
  }
  if (!invitation || invitation.status !== "pending") {
    console.log(`Invitation ${invitationId} is not pending; skipping email.`);
    return;
  }

  const { data: workspace, error: workspaceError } = await supabase
    .schema("orbit")
    .from("workspaces")
    .select("name")
    .eq("id", invitation.workspace_id)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
  }

  const inviteUrl = `${orbitOrigin}/invite/accept?token=${encodeURIComponent(invitation.token_hash)}`;
  await sendInvitationEmail({
    email: invitation.email_normalized,
    workspaceName: workspace?.name ?? "a workspace",
    inviteUrl,
  });
}

async function processEvent(event) {
  if (event.event_type === "invitation.created") {
    await handleInvitationCreated(event.payload);
    return;
  }

  console.log(`No handler for ${event.event_type}; marking completed.`);
}

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

let handled = 0;

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

  try {
    await processEvent(event);
    await supabase
      .schema("orbit_private")
      .from("outbox_events")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        lease_expires_at: null,
      })
      .eq("id", event.id);
    handled += 1;
    console.log(`Completed ${event.event_type} (${event.id})`);
  } catch (processError) {
    const message =
      processError instanceof Error ? processError.message : String(processError);
    console.error(`Failed ${event.event_type} (${event.id}):`, message);
    await supabase
      .schema("orbit_private")
      .from("outbox_events")
      .update({
        status: event.attempts + 1 >= 5 ? "dead" : "pending",
        next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        lease_expires_at: null,
      })
      .eq("id", event.id);
  }
}

console.log(`Handled ${handled} outbox event(s).`);
