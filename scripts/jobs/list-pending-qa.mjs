#!/usr/bin/env node
/**
 * Output JSON array of listings that have pending Q&A items
 * (any item where needs_answer === true).
 *
 * Each entry includes the data needed to draft answers:
 *   listing_id, title, company, location, apply_url, description_text (truncated),
 *   ai_recommendation, ai_score, qa: [...] (full current array, with original indexes preserved)
 *
 * Usage:
 *   node scripts/jobs/list-pending-qa.mjs              # all listings with pending Qs
 *   node scripts/jobs/list-pending-qa.mjs --id <uuid>  # one specific listing
 */

import { select } from "./lib/supabase.mjs";

const idArgIdx = process.argv.indexOf("--id");
const FILTER_ID = idArgIdx >= 0 ? process.argv[idArgIdx + 1] : null;

const SELECT = [
  "id",
  "title",
  "company",
  "location",
  "apply_url",
  "ai_score",
  "ai_recommendation",
  "ai_application_qa",
  "description_text",
].join(",");

function hasPending(qa) {
  return Array.isArray(qa) && qa.some((q) => q && q.needs_answer === true);
}

async function main() {
  let q = `select=${SELECT}`;
  if (FILTER_ID) {
    q += `&id=eq.${FILTER_ID}`;
  } else {
    // PostgREST jsonb filter: items where any element has needs_answer=true.
    // We can't do a perfect server-side filter without a custom function, so
    // fetch all listings with non-empty ai_application_qa and filter client-side.
    q += `&ai_application_qa=not.eq.[]&limit=1000`;
  }
  const rows = await select("job_listings", q);
  const filtered = (rows ?? []).filter((r) => hasPending(r.ai_application_qa));

  const out = filtered.map((r) => ({
    listing_id: r.id,
    title: r.title,
    company: r.company,
    location: r.location,
    apply_url: r.apply_url,
    ai_score: r.ai_score,
    ai_recommendation: r.ai_recommendation,
    description_text: (r.description_text ?? "").slice(0, 4000),
    qa: r.ai_application_qa,
  }));

  process.stdout.write(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("list-pending-qa failed:", err);
  process.exit(1);
});
