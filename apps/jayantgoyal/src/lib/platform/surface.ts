export type PlatformSurface = "legacy" | "studio";

const STUDIO_HOSTS = new Set([
  "studio.jayantgoyal.com",
  "studio.staging.jayantgoyal.com",
  "studio.localhost",
]);

export function normalizeHostname(host?: string | null): string {
  const value = host?.trim().toLowerCase().replace(/^https?:\/\//, "") ?? "";

  return value.split("/")[0]?.split(":")[0] ?? "";
}

export function isStudioHost(host?: string | null): boolean {
  const hostname = normalizeHostname(host);
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].map(normalizeHostname);

  return STUDIO_HOSTS.has(hostname) || vercelHosts.includes(hostname);
}

export function resolvePlatformSurface(host?: string | null): PlatformSurface {
  return isStudioHost(host) ? "studio" : "legacy";
}
