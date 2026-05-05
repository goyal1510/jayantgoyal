#!/usr/bin/env node
/**
 * Fetch the live application form schema for a single listing so the
 * /prepare-application slash command can pre-fill every field.
 *
 * Usage:
 *   node scripts/jobs/fetch-form.mjs <listing-id>
 *
 * Output (JSON on stdout):
 *   {
 *     listing: { id, title, company, location, apply_url, ... },
 *     source_kind: "greenhouse" | "lever" | "wwr" | "remotive" | "hn_hiring" | ...,
 *     format: "greenhouse_json" | "lever_json" | "fallback_html" | "no_form",
 *     fields: [
 *       { label, name, type, required, values: [{label, value}] | null,
 *         description?: string, group?: "main" | "demographic" | "location" }
 *     ],
 *     raw: original API payload | HTML | null
 *   }
 *
 * For "fallback_html" the slash command should WebFetch the apply_url
 * and extract fields from the page itself.
 */

import { select } from "./lib/supabase.mjs";

const id = process.argv[2];
if (!id) {
  console.error("Usage: fetch-form.mjs <listing-id>");
  process.exit(1);
}

async function loadListing() {
  const rows = await select(
    "job_listings",
    `id=eq.${id}&select=*,source:job_sources(kind,label,config)`
  );
  if (!rows || rows.length === 0) throw new Error(`Listing ${id} not found`);
  return rows[0];
}

function flatten(group, label, questions) {
  const out = [];
  for (const q of questions ?? []) {
    const fields = q.fields ?? [];
    for (const f of fields) {
      const values = (f.values ?? []).map((v) => ({
        value: v.value,
        label: v.label,
      }));
      out.push({
        group,
        label: q.label || label,
        description: q.description ?? null,
        name: f.name,
        type: f.type,
        required: !!q.required,
        values: values.length ? values : null,
      });
    }
  }
  return out;
}

async function fetchGreenhouse(slug, externalId) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    slug
  )}/jobs/${encodeURIComponent(externalId)}?questions=true`;
  const res = await fetch(url, {
    headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0" },
  });
  if (!res.ok) throw new Error(`Greenhouse ${slug}/${externalId} HTTP ${res.status}`);
  const data = await res.json();
  const fields = [
    ...flatten("main", null, data.questions),
    ...flatten("location", null, data.location_questions),
    ...flatten("demographic", null, data.demographic_questions),
    ...flatten("compliance", null, data.compliance),
  ];
  return { format: "greenhouse_json", fields, raw: data };
}

async function fetchLever(slug, externalId) {
  // Lever's posting JSON sometimes includes additionalQuestions but not
  // the full applicant form schema. We fetch the posting and let the slash
  // command fall back to WebFetch on the apply URL when needed.
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(
    slug
  )}/${encodeURIComponent(externalId)}?mode=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0" },
  });
  if (!res.ok) throw new Error(`Lever ${slug}/${externalId} HTTP ${res.status}`);
  const data = await res.json();
  const aq = Array.isArray(data?.additionalQuestions)
    ? data.additionalQuestions
    : [];
  if (aq.length === 0) {
    return { format: "fallback_html", fields: [], raw: data };
  }
  // Approximate Lever question shape
  const fields = aq.map((q, i) => ({
    group: "main",
    label: q.text ?? `Question ${i + 1}`,
    description: null,
    name: `lever_q_${i}`,
    type: q.fields?.[0]?.type ?? "textarea",
    required: !!q.required,
    values: null,
  }));
  return { format: "lever_json", fields, raw: data };
}

async function main() {
  const listing = await loadListing();
  const source_kind = listing.source?.kind ?? null;
  const slug = listing.source?.config?.company ?? listing.source?.label ?? null;

  let payload;
  try {
    if (source_kind === "greenhouse") {
      payload = await fetchGreenhouse(slug, listing.external_id);
    } else if (source_kind === "lever") {
      payload = await fetchLever(slug, listing.external_id);
    } else {
      payload = { format: "fallback_html", fields: [], raw: null };
    }
  } catch (err) {
    console.error("fetch-form: fallback to apply_url —", err.message);
    payload = { format: "fallback_html", fields: [], raw: null };
  }

  const out = {
    listing: {
      id: listing.id,
      title: listing.title,
      company: listing.company,
      location: listing.location,
      apply_url: listing.apply_url,
      external_id: listing.external_id,
      description_text: (listing.description_text || "").slice(0, 4000),
    },
    source_kind,
    ...payload,
  };

  process.stdout.write(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("fetch-form failed:", err);
  process.exit(1);
});
