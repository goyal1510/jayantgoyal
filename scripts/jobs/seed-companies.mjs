#!/usr/bin/env node
/**
 * Probe Greenhouse + Lever for each candidate company and insert working
 * ones into jg_app.job_sources.
 *
 * Usage:
 *   node scripts/jobs/seed-companies.mjs            # probe + insert
 *   node scripts/jobs/seed-companies.mjs --dry-run  # probe only, no DB writes
 *
 * Idempotent — safe to re-run after editing scripts/jobs/lib/companies.mjs.
 */

import { COMPANIES, ATS_PROBES } from "./lib/companies.mjs";
import { upsert } from "./lib/supabase.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = 8;

async function probe(slug, ats) {
  const url = ATS_PROBES[ats](slug);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    if (ats === "greenhouse") {
      const count = Array.isArray(data?.jobs) ? data.jobs.length : 0;
      return { ok: true, count };
    }
    if (ats === "lever") {
      const count = Array.isArray(data) ? data.length : 0;
      return { ok: true, count };
    }
    if (ats === "ashby") {
      const count = Array.isArray(data?.jobs) ? data.jobs.length : 0;
      return { ok: count > 0, count }; // ashby returns 200 even when empty
    }
    return { ok: false, status: 0 };
  } catch (err) {
    return { ok: false, status: 0, err: err.message };
  }
}

async function probeCompany(c) {
  const order = c.ats === "auto" ? ["greenhouse", "lever", "ashby"] : [c.ats];
  for (const ats of order) {
    const r = await probe(c.slug, ats);
    if (r.ok) return { ...c, ats, count: r.count };
  }
  return { ...c, ats: null, count: 0 };
}

async function pool(items, n, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`Probing ${COMPANIES.length} candidates (concurrency=${CONCURRENCY})...\n`);
  const results = await pool(COMPANIES, CONCURRENCY, probeCompany);

  const found = results.filter((r) => r.ats);
  const missed = results.filter((r) => !r.ats);

  console.log("✓ Found:");
  for (const r of found) {
    console.log(`  ${r.ats.padEnd(10)} ${r.slug.padEnd(20)} ${r.count} jobs  (${r.name})`);
  }
  console.log("\n✗ Not found on Greenhouse or Lever:");
  for (const r of missed) {
    console.log(`  ${r.slug.padEnd(20)} (${r.name})`);
  }

  if (DRY_RUN) {
    console.log("\n[dry-run] No DB writes.");
    return;
  }

  // Dedupe: same (kind, label) can appear twice if a slug is in COMPANIES
  // both as "auto" and as an explicit ATS — keep the first.
  const seen = new Set();
  const rows = [];
  for (const r of found) {
    const key = `${r.ats}::${r.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      kind: r.ats,
      label: r.slug,
      config: { company: r.slug, name: r.name },
      is_active: true,
    });
  }

  if (rows.length === 0) {
    console.log("\nNothing to insert.");
    return;
  }

  console.log(`\nUpserting ${rows.length} rows into jg_app.job_sources...`);
  const inserted = await upsert("job_sources", rows, { onConflict: "kind,label" });
  console.log(`✓ Done. ${inserted?.length ?? rows.length} rows in DB.`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
