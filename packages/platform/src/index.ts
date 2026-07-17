import { APP_BRANDS, type AppBrandId } from "@repo/brand";

export type ApplicationId = AppBrandId;

const APPLICATION_HOSTS: Record<ApplicationId, readonly string[]> = {
  portfolio: ["jayantgoyal.com", "www.jayantgoyal.com"],
  studio: ["studio.jayantgoyal.com"],
  admin: ["admin.jayantgoyal.com"],
  auth: ["auth.jayantgoyal.com"],
};

export function normalizeHostname(host: string | null | undefined): string {
  const value =
    host
      ?.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "") ?? "";
  return value.split("/")[0]?.split(":")[0] ?? "";
}

export function normalizeOrigin(
  value: string | null | undefined,
  fallback: string,
): string {
  try {
    return new URL(value ?? fallback).origin;
  } catch {
    return new URL(fallback).origin;
  }
}

export function applicationOrigin(
  appId: ApplicationId,
  override?: string | null,
): string {
  return normalizeOrigin(override, APP_BRANDS[appId].canonicalUrl);
}

export function applicationUrl(
  appId: ApplicationId,
  pathname = "/",
  override?: string | null,
): string {
  return new URL(pathname, `${applicationOrigin(appId, override)}/`).toString();
}

export function isApplicationHost(
  appId: ApplicationId,
  host: string | null | undefined,
): boolean {
  return APPLICATION_HOSTS[appId].includes(normalizeHostname(host));
}

export function rewriteApplicationUrl({
  value,
  sourceApps,
  targetApp,
  targetOrigin,
}: {
  value: string;
  sourceApps: ApplicationId[];
  targetApp: ApplicationId;
  targetOrigin?: string | null;
}): string {
  try {
    const url = new URL(value);
    const isSource = sourceApps.some((appId) =>
      isApplicationHost(appId, url.host),
    );
    if (!isSource) return value;

    return applicationUrl(
      targetApp,
      `${url.pathname}${url.search}${url.hash}`,
      targetOrigin,
    );
  } catch {
    return value;
  }
}
