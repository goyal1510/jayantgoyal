export type PlatformSurface = "legacy" | "studio";

const STUDIO_HOSTS = new Set([
  "studio.jayantgoyal.com",
  "studio.staging.jayantgoyal.com",
  "studio.localhost",
]);

export function normalizeHostname(host?: string | null): string {
  return host?.toLowerCase().split(":")[0] ?? "";
}

export function isStudioHost(host?: string | null): boolean {
  return STUDIO_HOSTS.has(normalizeHostname(host));
}

export function resolvePlatformSurface(host?: string | null): PlatformSurface {
  return isStudioHost(host) ? "studio" : "legacy";
}
