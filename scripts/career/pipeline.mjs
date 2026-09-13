#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCareerClient, upsertOne } from "./lib/client.mjs";

const allowedSources = new Set([
  "wellfound",
  "linkedin",
  "career_page",
  "referral",
  "manual",
]);
const allowedOpportunityStatuses = new Set([
  "discovered",
  "shortlisted",
  "preparing",
  "ready_for_review",
  "approved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
  "skipped",
]);
const allowedApplicationStatuses = new Set([
  "submitted",
  "viewed",
  "in_review",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "unknown",
]);
const allowedOutreachStatuses = new Set([
  "draft",
  "ready_for_review",
  "approved",
  "sent",
  "replied",
  "declined",
  "failed",
  "cancelled",
]);
const allowedStatusUpdateFields = {
  applications: new Set([
    "id",
    "status",
    "source_status_text",
    "last_checked_at",
    "last_status_change_at",
    "reply_received_at",
    "next_action_at",
    "notes",
  ]),
  outreach: new Set([
    "id",
    "status",
    "sent_at",
    "replied_at",
    "last_checked_at",
    "provider_thread_url",
    "notes",
  ]),
};

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateBundle(bundle) {
  const errors = [];
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return ["Input must be a JSON object."];
  }
  if (!bundle.company?.name?.trim()) errors.push("company.name is required.");
  if (!bundle.opportunity?.title?.trim())
    errors.push("opportunity.title is required.");
  if (!allowedSources.has(bundle.opportunity?.source)) {
    errors.push("opportunity.source is invalid.");
  }
  if (!isHttpsUrl(bundle.opportunity?.source_url)) {
    errors.push("opportunity.source_url must be an HTTPS URL.");
  }
  if (
    bundle.opportunity?.status &&
    !allowedOpportunityStatuses.has(bundle.opportunity.status)
  ) {
    errors.push("opportunity.status is invalid.");
  }
  if (bundle.application && !bundle.confirmed_external_action) {
    errors.push(
      "application records require confirmed_external_action=true after the user confirms submission.",
    );
  }
  for (const [index, item] of (bundle.outreach ?? []).entries()) {
    if (!item.contact?.profile_url || !isHttpsUrl(item.contact.profile_url)) {
      errors.push(
        `outreach[${index}].contact.profile_url must be an HTTPS URL.`,
      );
    }
    if (
      ["sent", "replied"].includes(item.status) &&
      !bundle.confirmed_external_action
    ) {
      errors.push(
        `outreach[${index}] cannot be recorded as ${item.status} without confirmed_external_action=true.`,
      );
    }
    if (
      item.contact?.public_email &&
      !isHttpsUrl(item.contact.public_email_source_url)
    ) {
      errors.push(
        `outreach[${index}].contact.public_email_source_url is required for a public email.`,
      );
    }
  }
  return errors;
}

async function readInput(path) {
  if (!path)
    throw new Error("Usage: pnpm career:pipeline -- <input.json> [--dry-run]");
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

function validateStatusUpdates(input) {
  const errors = [];
  for (const [table, allowed] of [
    ["applications", allowedApplicationStatuses],
    ["outreach", allowedOutreachStatuses],
  ]) {
    for (const [index, update] of (input[table] ?? []).entries()) {
      if (!update.id) errors.push(`${table}[${index}].id is required.`);
      if (update.status && !allowed.has(update.status)) {
        errors.push(`${table}[${index}].status is invalid.`);
      }
      for (const field of Object.keys(update)) {
        if (!allowedStatusUpdateFields[table].has(field)) {
          errors.push(`${table}[${index}].${field} cannot be updated.`);
        }
      }
    }
  }
  return errors;
}

async function listDueStatusChecks(client) {
  const [applications, outreach] = await Promise.all([
    client.request("applications", {
      query:
        "?select=id,opportunity_id,status,last_checked_at&status=in.(submitted,viewed,in_review,interviewing,unknown)&order=last_checked_at.asc.nullsfirst",
    }),
    client.request("outreach", {
      query:
        "?select=id,contact_id,opportunity_id,channel,status,last_checked_at,provider_thread_url&status=eq.sent&order=last_checked_at.asc.nullsfirst",
    }),
  ]);
  const opportunityIds = [
    ...new Set([
      ...applications.map((item) => item.opportunity_id),
      ...outreach.map((item) => item.opportunity_id).filter(Boolean),
    ]),
  ];
  const contactIds = [...new Set(outreach.map((item) => item.contact_id))];
  const opportunities = opportunityIds.length
    ? await client.request("opportunities", {
        query: `?select=id,company_id,title,source,source_url,apply_url&id=in.(${opportunityIds.join(",")})`,
      })
    : [];
  const companyIds = [...new Set(opportunities.map((item) => item.company_id))];
  const companies = companyIds.length
    ? await client.request("companies", {
        query: `?select=id,name,canonical_url,careers_url,linkedin_url&id=in.(${companyIds.join(",")})`,
      })
    : [];
  const contacts = contactIds.length
    ? await client.request("contacts", {
        query: `?select=id,company_id,full_name,title,profile_url&id=in.(${contactIds.join(",")})`,
      })
    : [];
  return { applications, outreach, opportunities, companies, contacts };
}

async function applyStatusUpdates(client, input) {
  for (const table of ["applications", "outreach"]) {
    for (const update of input[table] ?? []) {
      const { id, ...changes } = update;
      await client.request(table, {
        method: "PATCH",
        query: `?id=eq.${encodeURIComponent(id)}`,
        body: changes,
      });
    }
  }
}

async function saveBundle(client, bundle) {
  const company = await upsertOne(client, "companies", bundle.company, "name");
  const opportunity = await upsertOne(
    client,
    "opportunities",
    { ...bundle.opportunity, company_id: company.id },
    "source_url",
  );

  if (bundle.draft) {
    await client.request("application_drafts", {
      method: "POST",
      body: { ...bundle.draft, opportunity_id: opportunity.id },
    });
  }

  if (bundle.application) {
    await upsertOne(
      client,
      "applications",
      { ...bundle.application, opportunity_id: opportunity.id },
      "opportunity_id",
    );
  }

  for (const item of bundle.outreach ?? []) {
    const contact = await upsertOne(
      client,
      "contacts",
      { ...item.contact, company_id: company.id },
      "profile_url",
    );
    await client.request("outreach", {
      method: "POST",
      body: {
        ...item,
        contact: undefined,
        contact_id: contact.id,
        opportunity_id: opportunity.id,
      },
    });
  }

  if (bundle.run) {
    await client.request("automation_runs", {
      method: "POST",
      body: bundle.run,
    });
  }

  return { company_id: company.id, opportunity_id: opportunity.id };
}

async function main() {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.includes("--list-due")) {
    process.stdout.write(
      `${JSON.stringify(await listDueStatusChecks(createCareerClient()))}\n`,
    );
    return;
  }

  const statusUpdatesIndex = argumentsList.indexOf("--status-updates");
  if (statusUpdatesIndex >= 0) {
    const input = await readInput(argumentsList[statusUpdatesIndex + 1]);
    const errors = validateStatusUpdates(input);
    if (errors.length > 0) throw new Error(errors.join("\n"));
    if (argumentsList.includes("--dry-run")) {
      process.stdout.write("Career status updates are valid.\n");
      return;
    }
    await applyStatusUpdates(createCareerClient(), input);
    process.stdout.write("Career status updates saved.\n");
    return;
  }

  const inputPath = argumentsList.find(
    (argument) => !argument.startsWith("--"),
  );
  const dryRun = argumentsList.includes("--dry-run");
  const bundle = await readInput(inputPath);
  const errors = validateBundle(bundle);
  if (errors.length > 0) throw new Error(errors.join("\n"));

  if (dryRun) {
    process.stdout.write("Career pipeline input is valid.\n");
    return;
  }

  const result = await saveBundle(createCareerClient(), bundle);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch((error) =>
  fail(error instanceof Error ? error.message : String(error)),
);
