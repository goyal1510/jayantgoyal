#!/usr/bin/env node

import { createDatabaseBoundaryHttp, databaseAuthHeaders } from "../lib/database-boundary-http.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { expectStatus, request } = createDatabaseBoundaryHttp(supabaseUrl);

const response = await request("/rest/v1/rpc/process_pending_import_jobs", {
  method: "POST",
  headers: {
    ...databaseAuthHeaders(serviceRoleKey, "orbit"),
    "content-type": "application/json",
  },
  body: JSON.stringify({ p_limit: 5 }),
});

const count = await expectStatus(response, [200], "orbit.process_pending_import_jobs");
console.log(`Processed ${count ?? 0} import job(s).`);
