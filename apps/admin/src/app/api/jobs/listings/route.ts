import { NextResponse } from "next/server";
import { authorizeAndGetClient } from "../_helpers";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const auth = await authorizeAndGetClient();
  if ("error" in auth) return auth.error;
  const { client } = auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const india = searchParams.get("india") === "true";
  const remote = searchParams.get("remote") === "true";
  const sourceKind = searchParams.get("source_kind");
  const sourceId = searchParams.get("source_id");
  const matchesKeywords = searchParams.get("matches_keywords") === "true";
  const hasSalary = searchParams.get("has_salary") === "true";
  const minSalaryInr = searchParams.get("min_salary_inr");
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10))
  );

  const aiScored = searchParams.get("ai_scored") === "true";
  const minAiScore = searchParams.get("min_ai_score");
  const recommendation = searchParams.get("recommendation");
  const priority = searchParams.get("priority");
  const sort = searchParams.get("sort") ?? "posted_at";

  let query = client
    .from("job_listings")
    .select(
      `*, source:job_sources!inner(kind, label), application:job_applications(id, status, priority, applied_at, notes, next_action_at)`,
      { count: "exact" }
    );

  if (q) {
    const safe = q.replace(/[%,]/g, "");
    query = query.or(
      `title.ilike.%${safe}%,company.ilike.%${safe}%,description_text.ilike.%${safe}%`
    );
  }
  if (india) query = query.eq("is_india", true);
  if (remote) query = query.eq("is_remote", true);
  if (sourceKind && sourceKind !== "all") {
    const kinds = sourceKind.split(",").filter(Boolean);
    if (kinds.length === 1) query = query.eq("source.kind", kinds[0]);
    else if (kinds.length > 1) query = query.in("source.kind", kinds);
  }
  if (sourceId) query = query.eq("source_id", sourceId);
  if (hasSalary) query = query.not("salary_min_inr", "is", null);
  if (minSalaryInr) query = query.gte("salary_min_inr", parseInt(minSalaryInr, 10));
  if (aiScored) query = query.not("ai_processed_at", "is", null);
  if (minAiScore) query = query.gte("ai_score", parseInt(minAiScore, 10));
  if (recommendation && recommendation !== "all") {
    const recs = recommendation.split(",").filter(Boolean);
    if (recs.length === 1) query = query.eq("ai_recommendation", recs[0]);
    else if (recs.length > 1) query = query.in("ai_recommendation", recs);
  }

  if (matchesKeywords) {
    const { data: criteria } = await client
      .from("job_search_criteria")
      .select("keywords")
      .eq("is_active", true)
      .limit(1)
      .single();
    const keywords: string[] = (criteria?.keywords as string[] | undefined) ?? [];
    if (keywords.length > 0) {
      const orParts = keywords
        .map((k) => k.replace(/[%,]/g, ""))
        .filter(Boolean)
        .map((k) => `description_text.ilike.%${k}%,title.ilike.%${k}%`)
        .join(",");
      if (orParts) query = query.or(orParts);
    }
  }

  if (sort === "ai_score") {
    query = query
      .order("ai_score", { ascending: false, nullsFirst: false })
      .order("posted_at", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("posted_at", { ascending: false, nullsFirst: false });
  }
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let listings = (data ?? []).map((row: Record<string, unknown>) => {
    const sourceObj = (row.source as { kind?: string } | null) ?? null;
    const apps = row.application as Array<Record<string, unknown>> | null;
    return {
      ...row,
      source_kind: sourceObj?.kind ?? null,
      application: apps && apps.length > 0 ? apps[0] : null,
    };
  });

  if (status && status !== "all") {
    const statuses = new Set(status.split(",").filter(Boolean));
    listings = listings.filter((l: { application: { status?: string } | null }) => {
      if (statuses.has("none") && !l.application) return true;
      if (l.application?.status && statuses.has(l.application.status)) return true;
      return false;
    });
  }

  if (priority && priority !== "all") {
    const priorities = new Set(priority.split(",").filter(Boolean));
    listings = listings.filter(
      (l: { application: { priority?: string } | null }) =>
        l.application?.priority ? priorities.has(l.application.priority) : false
    );
  }

  return NextResponse.json({
    data: listings,
    total: count ?? listings.length,
    page,
    pageSize,
  });
}
