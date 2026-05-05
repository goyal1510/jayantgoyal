#!/usr/bin/env node
/**
 * List candidate listings for the AI to score / draft.
 *
 * Modes:
 *   --mode compact   id, title, company, location, posted_at, source_kind, salary, snippet (first ~300 chars), tags
 *   --mode full      everything compact + full description_text + apply_url
 *
 * Filters:
 *   --days <N>       only listings posted in last N days (default 21)
 *   --limit <N>      cap (default 300 compact / 80 full)
 *   --india-only     only is_india=true (default true)
 *   --include-india-false  override india-only
 *   --unscored-only  only listings with ai_processed_at IS NULL (default true)
 *   --rescore        include already-scored too
 *   --ids <csv>      explicit list of listing IDs (overrides other filters)
 *
 * Output: JSON array on stdout. Errors on stderr.
 */

import { select } from "./lib/supabase.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    mode: "compact",
    days: 21,
    limit: null,
    indiaOnly: true,
    unscoredOnly: true,
    ids: null,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--mode") opts.mode = args[++i];
    else if (a === "--days") opts.days = parseInt(args[++i], 10);
    else if (a === "--limit") opts.limit = parseInt(args[++i], 10);
    else if (a === "--india-only") opts.indiaOnly = true;
    else if (a === "--include-india-false") opts.indiaOnly = false;
    else if (a === "--unscored-only") opts.unscoredOnly = true;
    else if (a === "--rescore") opts.unscoredOnly = false;
    else if (a === "--ids") opts.ids = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (opts.limit == null) opts.limit = opts.mode === "full" ? 80 : 300;
  return opts;
}

function buildQuery(opts) {
  const compactSelect = [
    "id",
    "title",
    "company",
    "location",
    "is_remote",
    "is_india",
    "salary_text",
    "salary_min_inr",
    "salary_max_inr",
    "salary_currency",
    "posted_at",
    "tags",
    "apply_url",
    "ai_score",
    "ai_recommendation",
    "ai_processed_at",
    "ai_application_qa",
    "description_text",
    "source:job_sources(kind,label)",
  ].join(",");
  const fullSelect = compactSelect;

  let q = `select=${opts.mode === "full" ? fullSelect : compactSelect}`;

  if (opts.ids && opts.ids.length > 0) {
    q += `&id=in.(${opts.ids.map((i) => `"${i}"`).join(",")})`;
  } else {
    if (opts.indiaOnly) q += `&is_india=eq.true`;
    if (opts.unscoredOnly) q += `&ai_processed_at=is.null`;
    if (opts.days > 0) {
      const cutoff = new Date(Date.now() - opts.days * 86400 * 1000).toISOString();
      q += `&or=(posted_at.gte.${cutoff},posted_at.is.null)`;
    }
  }

  q += `&order=posted_at.desc.nullslast&limit=${opts.limit}`;
  return q;
}

async function selectPaginated(table, baseQuery, totalLimit) {
  const PAGE = 1000;
  const all = [];
  let offset = 0;
  while (offset < totalLimit) {
    const remaining = Math.min(PAGE, totalLimit - offset);
    // PostgREST limit is per request; we paginate via offset.
    const q = baseQuery.replace(/&limit=\d+/, "") + `&limit=${remaining}&offset=${offset}`;
    const page = await select(table, q);
    if (!page || page.length === 0) break;
    all.push(...page);
    if (page.length < remaining) break;
    offset += page.length;
  }
  return all;
}

async function main() {
  const opts = parseArgs();
  const baseQuery = buildQuery(opts);
  const data = opts.limit > 1000
    ? await selectPaginated("job_listings", baseQuery, opts.limit)
    : await select("job_listings", baseQuery);

  const out = (data ?? []).map((row) => {
    const base = {
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      is_remote: row.is_remote,
      is_india: row.is_india,
      salary_text: row.salary_text,
      salary_min_inr: row.salary_min_inr,
      salary_max_inr: row.salary_max_inr,
      salary_currency: row.salary_currency,
      posted_at: row.posted_at,
      tags: row.tags,
      apply_url: row.apply_url,
      source_kind: row.source?.kind ?? null,
      source_label: row.source?.label ?? null,
      ai_score: row.ai_score,
      ai_recommendation: row.ai_recommendation,
      already_processed: !!row.ai_processed_at,
    };
    if (opts.mode === "full") {
      base.description_text = row.description_text;
    } else if (row.description_text) {
      base.snippet = row.description_text.slice(0, 350);
    }
    return base;
  });

  process.stdout.write(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("list-candidates failed:", err);
  process.exit(1);
});
