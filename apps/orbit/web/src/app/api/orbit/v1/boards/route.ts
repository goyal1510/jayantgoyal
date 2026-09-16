import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createDatabaseBoundaryHttp, databaseAuthHeaders } from "@/lib/orbit/database-boundary-http";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { expectStatus, request: dbRequest } = createDatabaseBoundaryHttp(supabaseUrl);

  const verifyResponse = await dbRequest("/rest/v1/rpc/verify_api_token", {
    method: "POST",
    headers: {
      ...databaseAuthHeaders(serviceRoleKey, "orbit"),
      "content-type": "application/json",
    },
    body: JSON.stringify({ p_token_hash: tokenHash }),
  });

  let verified: { workspace_id?: string; scopes?: string[] } | null = null;
  try {
    verified = (await expectStatus(verifyResponse, [200], "orbit.verify_api_token")) as {
      workspace_id?: string;
      scopes?: string[];
    } | null;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!verified?.workspace_id || !verified.scopes?.includes("boards:read")) {
    return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
  }

  const boardsResponse = await dbRequest(
    `/rest/v1/boards?select=id,key,name,visibility&workspace_id=eq.${verified.workspace_id}`,
    {
      headers: databaseAuthHeaders(serviceRoleKey, "orbit"),
    },
  );

  const boards = await expectStatus(boardsResponse, [200], "orbit.boards");
  return NextResponse.json({ boards });
}
