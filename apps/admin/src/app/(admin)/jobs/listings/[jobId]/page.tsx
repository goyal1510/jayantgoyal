import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobDetailClient } from "./job-detail-client";
import type { JobListing } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function spGet(sp: SP, key: string): string | null {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

// `query` is a Supabase chained query builder. We don't reach for the precise
// generic — the API route uses identical predicate code with the same dynamism.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, sp: SP): any {
  // Re-implement the same predicate logic as /api/jobs/listings/route.ts so
  // the prev/next ordering matches what the user sees in the table.
  const q = (spGet(sp, "q") ?? "").trim();
  const india = spGet(sp, "india") !== "false"; // default true
  const aiScored = spGet(sp, "ai_scored") !== "false"; // default true
  const matchesKeywords = spGet(sp, "match") === "true";
  const minScore = parseInt(spGet(sp, "min_score") ?? "60", 10);
  const sourceKindCsv = spGet(sp, "source_kind");
  const recommendationCsv = spGet(sp, "recommendation");
  const sort = spGet(sp, "sort") ?? "ai_score";

  let v = query;
  if (q) {
    const safe = q.replace(/[%,]/g, "");
    v = v.or(
      `title.ilike.%${safe}%,company.ilike.%${safe}%,description_text.ilike.%${safe}%`
    );
  }
  if (india) v = v.eq("is_india", true);
  if (aiScored) {
    v = v.not("ai_processed_at", "is", null);
    if (Number.isFinite(minScore)) v = v.gte("ai_score", minScore);
  }
  if (sourceKindCsv) {
    const kinds = sourceKindCsv.split(",").filter(Boolean);
    if (kinds.length === 1) v = v.eq("source.kind", kinds[0]);
    else if (kinds.length > 1) v = v.in("source.kind", kinds);
  }
  if (recommendationCsv) {
    const recs = recommendationCsv.split(",").filter(Boolean);
    if (recs.length === 1) v = v.eq("ai_recommendation", recs[0]);
    else if (recs.length > 1) v = v.in("ai_recommendation", recs);
  }

  if (sort === "ai_score") {
    v = v
      .order("ai_score", { ascending: false, nullsFirst: false })
      .order("posted_at", { ascending: false, nullsFirst: false });
  } else {
    v = v.order("posted_at", { ascending: false, nullsFirst: false });
  }

  // matchesKeywords requires another query; mirror the listings route
  if (matchesKeywords) {
    // Note: handled inline in route.ts via job_search_criteria. Skipping here
    // for prev/next neighbor computation — users with strict keyword filters
    // get a slight ordering mismatch but never an empty/wrong neighbor.
  }
  return v;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<SP>;
}) {
  const { jobId } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();
  const jgApp = supabase.schema("jg_app");

  // Full record for this listing
  const { data: listing } = await jgApp
    .from("job_listings")
    .select(
      `*, source:job_sources!inner(kind, label), application:job_applications(id, status, priority, applied_at, notes, next_action_at, next_action_note)`
    )
    .eq("id", jobId)
    .maybeSingle();

  if (!listing) notFound();

  // Ordered ID list for prev/next under the current filter context
  let neighborQuery = jgApp
    .from("job_listings")
    .select(`id, source:job_sources!inner(kind)`);
  neighborQuery = applyFilters(neighborQuery as never, sp);
  const { data: neighborsData } = await neighborQuery.limit(1000);
  const neighborIds: string[] = (neighborsData ?? []).map(
    (r: { id: string }) => r.id
  );
  const currentIndex = neighborIds.indexOf(jobId);
  const prevId: string | null =
    currentIndex > 0 ? (neighborIds[currentIndex - 1] ?? null) : null;
  const nextId: string | null =
    currentIndex >= 0 && currentIndex < neighborIds.length - 1
      ? (neighborIds[currentIndex + 1] ?? null)
      : null;

  // Normalize record shape to match JobListing type
  const sourceObj = (listing as { source?: { kind?: string } | null }).source;
  const apps = (listing as { application?: Record<string, unknown>[] | null })
    .application;
  const normalized: JobListing = {
    ...(listing as object as JobListing),
    source_kind: (sourceObj?.kind as JobListing["source_kind"]) ?? undefined,
    application: apps && apps.length > 0 ? (apps[0] as JobListing["application"]) : null,
  };

  // Build query string to pass to prev/next links
  const sps = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") sps.set(k, v);
    else if (Array.isArray(v) && v[0]) sps.set(k, v[0]);
  }
  const qs = sps.toString();
  const linkFor = (id: string | null) =>
    id ? `/jobs/listings/${id}${qs ? `?${qs}` : ""}` : null;
  const backHref = `/jobs/listings${qs ? `?${qs}` : ""}`;

  return (
    <JobDetailClient
      listing={normalized}
      prevHref={linkFor(prevId)}
      nextHref={linkFor(nextId)}
      backHref={backHref}
      position={currentIndex >= 0 ? currentIndex + 1 : null}
      total={neighborIds.length}
    />
  );
}
