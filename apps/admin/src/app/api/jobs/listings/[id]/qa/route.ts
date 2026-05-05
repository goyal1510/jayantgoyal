import { NextResponse } from "next/server";
import { authorizeAndGetClient } from "../../../_helpers";

type QaItem = {
  question: string;
  answer: string | null;
  category?: string;
  needs_answer?: boolean;
  created_at?: string;
  answered_at?: string | null;
};

async function loadQa(client: ReturnType<typeof authorizeAndGetClient> extends Promise<infer R>
  ? R extends { client: infer C }
    ? C
    : never
  : never, id: string): Promise<{ qa: QaItem[]; error?: NextResponse }> {
  const { data, error } = await client
    .from("job_listings")
    .select("ai_application_qa")
    .eq("id", id)
    .single();
  if (error || !data) {
    return { qa: [], error: NextResponse.json({ error: "Listing not found" }, { status: 404 }) };
  }
  const raw = data.ai_application_qa;
  return { qa: Array.isArray(raw) ? (raw as QaItem[]) : [] };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const { qa, error } = await loadQa(auth.client, id);
  if (error) return error;
  return NextResponse.json({ data: qa });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = await request.json();
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  const category = typeof body.category === "string" ? body.category : "user_added";
  const answer = typeof body.answer === "string" ? body.answer : null;

  const { qa, error } = await loadQa(auth.client, id);
  if (error) return error;

  const newItem: QaItem = {
    question,
    answer,
    category,
    needs_answer: !answer,
    created_at: new Date().toISOString(),
    answered_at: answer ? new Date().toISOString() : null,
  };

  const next = [...qa, newItem];
  const { data, error: updateErr } = await auth.client
    .from("job_listings")
    .update({ ai_application_qa: next })
    .eq("id", id)
    .select("ai_application_qa")
    .single();
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ data: data?.ai_application_qa });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = await request.json();
  const index = typeof body.index === "number" ? body.index : -1;
  const patch = body.patch as Partial<QaItem> | undefined;
  if (index < 0 || !patch) {
    return NextResponse.json({ error: "index and patch are required" }, { status: 400 });
  }

  const { qa, error } = await loadQa(auth.client, id);
  if (error) return error;
  const existing = qa[index];
  if (!existing) {
    return NextResponse.json({ error: "index out of range" }, { status: 400 });
  }

  const updated: QaItem = { ...existing, ...patch, question: patch.question ?? existing.question };
  if (patch.answer && existing.needs_answer) {
    updated.needs_answer = false;
    updated.answered_at = new Date().toISOString();
  }
  const next = qa.map((q, i) => (i === index ? updated : q));

  const { data, error: updateErr } = await auth.client
    .from("job_listings")
    .update({ ai_application_qa: next })
    .eq("id", id)
    .select("ai_application_qa")
    .single();
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ data: data?.ai_application_qa });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const index = parseInt(searchParams.get("index") ?? "-1", 10);
  if (index < 0) {
    return NextResponse.json({ error: "index query param required" }, { status: 400 });
  }

  const { qa, error } = await loadQa(auth.client, id);
  if (error) return error;
  if (index >= qa.length) {
    return NextResponse.json({ error: "index out of range" }, { status: 400 });
  }

  const next = qa.filter((_, i) => i !== index);
  const { data, error: updateErr } = await auth.client
    .from("job_listings")
    .update({ ai_application_qa: next })
    .eq("id", id)
    .select("ai_application_qa")
    .single();
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ data: data?.ai_application_qa });
}
