export function normalizeHostname(host?: string | null): string {
  const value = host?.trim().toLowerCase().replace(/^https?:\/\//, "") ?? "";

  return value.split("/")[0]?.split(":")[0] ?? "";
}
