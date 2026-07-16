import type { VercelProjectKey } from "@/lib/types";

const VERCEL_API_BASE = "https://api.vercel.com";

export function getVercelToken(): string | undefined {
  return process.env.VERCEL_TOKEN;
}

export function getTeamId(): string | undefined {
  return process.env.VERCEL_TEAM_ID;
}

export function getProjectId(project: VercelProjectKey): string | undefined {
  if (project === "studio") return process.env.VERCEL_PROJECT_ID_STUDIO;
  if (project === "admin") return process.env.VERCEL_PROJECT_ID_ADMIN;
  return undefined;
}

export async function vercelFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getVercelToken();
  if (!token) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  const teamId = getTeamId();
  const url = new URL(`${VERCEL_API_BASE}${path}`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  return fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
