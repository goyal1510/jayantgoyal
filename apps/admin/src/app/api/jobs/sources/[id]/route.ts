import { NextResponse } from "next/server";
import { authorizeAndGetClient } from "../../_helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { client } = auth;
  const { id } = await params;

  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") allowed.is_active = body.is_active;
  if (typeof body.label === "string") allowed.label = body.label;
  if (body.config !== undefined) allowed.config = body.config;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await client
    .from("job_sources")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { client } = auth;
  const { id } = await params;

  const { error } = await client.from("job_sources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
