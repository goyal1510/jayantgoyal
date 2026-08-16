import { PRODUCT_IDENTITIES, type ProductId } from "@jayantgoyal/identity";

export type ApplicationId = ProductId;

const APPLICATION_HOSTS: Record<ApplicationId, readonly string[]> = {
  portfolio: PRODUCT_IDENTITIES.portfolio.canonicalHosts,
  studio: PRODUCT_IDENTITIES.studio.canonicalHosts,
  admin: PRODUCT_IDENTITIES.admin.canonicalHosts,
  auth: PRODUCT_IDENTITIES.auth.canonicalHosts,
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
  return normalizeOrigin(override, PRODUCT_IDENTITIES[appId].canonicalOrigin);
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
