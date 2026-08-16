import { isAllowedGitHubProxyPath } from "@jayantgoyal/github/proxy";
import { githubServerClient } from "@jayantgoyal/github/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy GitHub API calls through the server to use GITHUB_TOKEN.
 * Query params:
 *   ?path=/users/goyal1510
 *   ?path=/users/goyal1510/repos&per_page=100&page=1&sort=updated
 *   ?path=/repos/owner/repo/languages
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 },
    );
  }

  if (!isAllowedGitHubProxyPath(path)) {
    return NextResponse.json({ error: "Forbidden path" }, { status: 403 });
  }

  const forwardParams = Object.fromEntries(
    [...searchParams.entries()].filter(([key]) => key !== "path"),
  );
  const response = await githubServerClient.request(path, forwardParams);
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
