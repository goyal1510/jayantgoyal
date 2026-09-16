#!/usr/bin/env node

/**
 * Creates recurring card copies when recurrence rules are due.
 * Run with service-role credentials from a trusted worker environment.
 */

import { createDatabaseBoundaryHttp, databaseAuthHeaders } from "../lib/database-boundary-http.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { expectStatus, request } = createDatabaseBoundaryHttp(supabaseUrl);

const response = await request("/rest/v1/rpc/process_due_recurrences_worker", {
  method: "POST",
  headers: {
    ...databaseAuthHeaders(serviceRoleKey, "orbit"),
    "content-type": "application/json",
  },
  body: "{}",
});

const count = await expectStatus(response, [200], "orbit.process_due_recurrences_worker");
console.log(`Processed ${count ?? 0} recurrence rule(s).`);
