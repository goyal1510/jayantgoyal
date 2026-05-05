import { NextResponse } from "next/server";
import { authorizeAndGetClient } from "../../../_helpers";

const ALLOWED_STATUSES = [
  "new",
  "interested",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { client } = auth;
  const { id: listingId } = await params;

  const body = await request.json();
  const { status, priority, notes, referral_contact, next_action_at, next_action_note } = body;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (priority && !["low", "medium", "high", "critical"].includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  const { data: listing, error: listingErr } = await client
    .from("job_listings")
    .select("title, company, apply_url")
    .eq("id", listingId)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: existing } = await client
    .from("job_applications")
    .select("id")
    .eq("listing_id", listingId)
    .maybeSingle();

  const patch: Record<string, unknown> = {};
  if (status !== undefined) {
    patch.status = status;
    if (status === "applied" && !existing) patch.applied_at = new Date().toISOString();
  }
  if (priority !== undefined) patch.priority = priority;
  if (notes !== undefined) patch.notes = notes;
  if (referral_contact !== undefined) patch.referral_contact = referral_contact;
  if (next_action_at !== undefined) patch.next_action_at = next_action_at;
  if (next_action_note !== undefined) patch.next_action_note = next_action_note;

  if (existing) {
    if (status === null || status === "") {
      const { error } = await client.from("job_applications").delete().eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: null });
    }
    const { data, error } = await client
      .from("job_applications")
      .update(patch)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (!status || status === "") {
    return NextResponse.json({ data: null });
  }

  const { data, error } = await client
    .from("job_applications")
    .insert({
      listing_id: listingId,
      title: listing.title,
      company: listing.company,
      apply_url: listing.apply_url,
      status,
      ...patch,
      applied_at: status === "applied" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
