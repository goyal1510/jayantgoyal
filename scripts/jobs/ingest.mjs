#!/usr/bin/env node
/**
 * Ingest jobs from all active sources in jg_app.job_sources, normalize,
 * and upsert into jg_app.job_listings.
 *
 * Usage:
 *   node scripts/jobs/ingest.mjs                  # all active sources
 *   node scripts/jobs/ingest.mjs --kind remotive  # only one kind
 *   node scripts/jobs/ingest.mjs --label stripe   # one specific source
 *   node scripts/jobs/ingest.mjs --dry-run        # fetch + normalize only
 */

import { select, upsert, update } from "./lib/supabase.mjs";
import { fetchRemotive } from "./sources/remotive.mjs";
import { fetchWwr } from "./sources/wwr.mjs";
import { fetchGreenhouse } from "./sources/greenhouse.mjs";
import { fetchLever } from "./sources/lever.mjs";
import { fetchHnHiring } from "./sources/hn-hiring.mjs";

const HANDLERS = {
  remotive: fetchRemotive,
  wwr: fetchWwr,
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  hn_hiring: fetchHnHiring,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { kind: null, label: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--kind") opts.kind = args[++i];
    else if (args[i] === "--label") opts.label = args[++i];
    else if (args[i] === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

async function loadSources({ kind, label }) {
  let q = "is_active=eq.true";
  if (kind) q += `&kind=eq.${encodeURIComponent(kind)}`;
  if (label) q += `&label=eq.${encodeURIComponent(label)}`;
  return select("job_sources", `${q}&select=*`);
}

async function ingestSource(source, dryRun) {
  const handler = HANDLERS[source.kind];
  if (!handler) {
    console.log(`  [skip] no handler for kind=${source.kind}`);
    return { count: 0, skipped: true };
  }

  let rows;
  try {
    rows = await handler(source);
  } catch (err) {
    console.error(`  [error] ${err.message}`);
    if (!dryRun) {
      await update("job_sources", `id=eq.${source.id}`, {
        last_fetched_at: new Date().toISOString(),
        last_fetch_status: "error",
        last_fetch_error: err.message.slice(0, 1000),
        last_fetch_count: 0,
      });
    }
    return { count: 0, error: err.message };
  }

  console.log(`  fetched ${rows.length} listings`);

  if (dryRun) {
    return { count: rows.length, dryRun: true };
  }

  const withSource = rows.map((r) => ({ ...r, source_id: source.id, fetched_at: new Date().toISOString() }));

  const BATCH = 200;
  for (let i = 0; i < withSource.length; i += BATCH) {
    const chunk = withSource.slice(i, i + BATCH);
    await upsert("job_listings", chunk, { onConflict: "source_id,external_id" });
  }

  await update("job_sources", `id=eq.${source.id}`, {
    last_fetched_at: new Date().toISOString(),
    last_fetch_status: "ok",
    last_fetch_error: null,
    last_fetch_count: rows.length,
  });

  return { count: rows.length };
}

async function main() {
  const opts = parseArgs();
  const sources = await loadSources(opts);
  if (!sources || sources.length === 0) {
    console.log("No active sources match.");
    return;
  }
  console.log(`Ingesting from ${sources.length} sources${opts.dryRun ? " (dry-run)" : ""}...\n`);

  let total = 0;
  for (const s of sources) {
    console.log(`[${s.kind}] ${s.label}`);
    const r = await ingestSource(s, opts.dryRun);
    total += r.count ?? 0;
  }

  console.log(`\nDone. Total listings ingested: ${total}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
