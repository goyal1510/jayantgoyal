#!/usr/bin/env node
/**
 * Persist AI-generated scoring + drafts for one or many listings.
 * Also creates/updates job_applications rows when status/priority is provided.
 *
 * Input: JSON array on stdin (or via --file path):
 * [
 *   {
 *     listing_id: "uuid",
 *     ai_score: 0..100,
 *     ai_recommendation: "apply" | "apply_with_referral" | "apply_if_time" | "skip" | "skip_red_flags",
 *     ai_reasoning: "string (1-3 sentences)",
 *     ai_red_flags: ["string", ...],     // optional
 *     ai_cover_letter: "markdown string", // optional, only for jobs you draft
 *     ai_referral_message: "markdown string", // optional
 *     ai_application_qa: [ { question, answer, category, needs_answer? }, ... ], // optional
 *     ai_resume_version: "2026-05-05" or git sha, // optional
 *     application: {
 *       status: "interested" | "applied" | "skip" | null,
 *       priority: "low"|"medium"|"high"|"critical",
 *       notes: "string",
 *       next_action_note: "string",
 *     } // optional — when present, upserts job_applications
 *   }
 * ]
 *
 * Use --dry-run to print the payloads without writing.
 */

import fs from "node:fs";
import { upsert, update, select, insert } from "./lib/supabase.mjs";

const DRY = process.argv.includes("--dry-run");
const fileArgIdx = process.argv.indexOf("--file");
const FILE = fileArgIdx >= 0 ? process.argv[fileArgIdx + 1] : null;

async function readStdin() {
  if (FILE) return fs.readFileSync(FILE, "utf-8");
  return new Promise((resolve, reject) => {
    let buf = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (c) => (buf += c));
    process.stdin.on("end", () => resolve(buf));
    process.stdin.on("error", reject);
  });
}

const VALID_RECS = new Set([
  "apply",
  "apply_with_referral",
  "apply_if_time",
  "skip",
  "skip_red_flags",
]);
const VALID_PRIORITIES = new Set(["low", "medium", "high", "critical"]);
const VALID_APP_STATUSES = new Set([
  "new",
  "interested",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
]);

async function main() {
  const raw = (await readStdin()).trim();
  if (!raw) {
    console.error("No input on stdin and no --file provided");
    process.exit(1);
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    process.exit(1);
  }
  if (!Array.isArray(payload)) {
    console.error("Expected JSON array");
    process.exit(1);
  }

  const now = new Date().toISOString();

  // Validate + collect updates
  const listingPatches = [];
  const appOperations = [];

  for (const [i, item] of payload.entries()) {
    if (!item.listing_id) {
      console.error(`Item ${i}: missing listing_id`);
      process.exit(1);
    }
    const patch = { ai_processed_at: now };
    if (item.ai_score != null) patch.ai_score = Math.max(0, Math.min(100, item.ai_score));
    if (item.ai_recommendation) {
      if (!VALID_RECS.has(item.ai_recommendation)) {
        console.error(`Item ${i}: invalid recommendation ${item.ai_recommendation}`);
        process.exit(1);
      }
      patch.ai_recommendation = item.ai_recommendation;
    }
    if (item.ai_reasoning != null) patch.ai_reasoning = item.ai_reasoning;
    if (item.ai_red_flags != null) patch.ai_red_flags = item.ai_red_flags;
    if (item.ai_cover_letter != null) patch.ai_cover_letter = item.ai_cover_letter;
    if (item.ai_referral_message != null) patch.ai_referral_message = item.ai_referral_message;
    if (item.ai_application_qa != null) {
      if (!Array.isArray(item.ai_application_qa)) {
        console.error(`Item ${i}: ai_application_qa must be an array`);
        process.exit(1);
      }
      patch.ai_application_qa = item.ai_application_qa;
    }
    if (item.ai_resume_version != null) patch.ai_resume_version = item.ai_resume_version;

    listingPatches.push({ listing_id: item.listing_id, patch });

    if (item.application) {
      const app = item.application;
      if (app.status && !VALID_APP_STATUSES.has(app.status) && app.status !== "skip") {
        console.error(`Item ${i}: invalid app status ${app.status}`);
        process.exit(1);
      }
      if (app.priority && !VALID_PRIORITIES.has(app.priority)) {
        console.error(`Item ${i}: invalid priority ${app.priority}`);
        process.exit(1);
      }
      appOperations.push({ listing_id: item.listing_id, app });
    }
  }

  if (DRY) {
    console.log(JSON.stringify({ listingPatches, appOperations }, null, 2));
    return;
  }

  // Apply listing patches one-by-one (PATCH per row).
  let listingsUpdated = 0;
  for (const { listing_id, patch } of listingPatches) {
    await update("job_listings", `id=eq.${listing_id}`, patch);
    listingsUpdated++;
  }

  // Apply application operations.
  let appsCreated = 0;
  let appsUpdated = 0;
  let appsDeleted = 0;
  for (const { listing_id, app } of appOperations) {
    const existing = await select("job_applications", `listing_id=eq.${listing_id}&select=id`);
    if (app.status === "skip") {
      if (existing && existing[0]) {
        await update("job_applications", `id=eq.${existing[0].id}`, { status: "withdrawn", notes: app.notes ?? null });
        appsDeleted++;
      }
      continue;
    }
    const status = app.status ?? "interested";
    const priority = app.priority ?? "medium";
    const data = {
      status,
      priority,
      ...(app.notes !== undefined ? { notes: app.notes } : {}),
      ...(app.next_action_note !== undefined ? { next_action_note: app.next_action_note } : {}),
      ...(status === "applied" ? { applied_at: now } : {}),
    };

    if (existing && existing[0]) {
      await update("job_applications", `id=eq.${existing[0].id}`, data);
      appsUpdated++;
    } else {
      // Look up listing for snapshot fields
      const listing = await select(
        "job_listings",
        `id=eq.${listing_id}&select=title,company,apply_url`
      );
      const snap = listing?.[0] ?? {};
      await insert("job_applications", [
        {
          listing_id,
          title: snap.title ?? "(unknown)",
          company: snap.company ?? "(unknown)",
          apply_url: snap.apply_url ?? null,
          ...data,
        },
      ]);
      appsCreated++;
    }
  }

  console.error(
    `✓ listings: ${listingsUpdated}  apps: +${appsCreated} ↻${appsUpdated} ✗${appsDeleted}`
  );
}

main().catch((err) => {
  console.error("save-ai-result failed:", err);
  process.exit(1);
});
