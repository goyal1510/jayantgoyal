import { jayantPortfolioData } from "@/lib/portfolio/profiles/jayant-portfolio-data";

const PORTFOLIO_PROFILES = {
  jayant: jayantPortfolioData,
} as const;

export type PortfolioProfileKey = keyof typeof PORTFOLIO_PROFILES;

/**
 * Legacy portfolio data type (from hardcoded profiles)
 * This matches the structure of jayant-portfolio-data.ts
 */
export type LegacyPortfolioData =
  (typeof PORTFOLIO_PROFILES)[PortfolioProfileKey];

const HOSTNAME_MAP: Record<string, PortfolioProfileKey> = {
  "portfolio.jayantgoyal.com": "jayant",
  "jayantgoyal.com": "jayant",
} as const;

export const DEFAULT_PORTFOLIO_PROFILE: PortfolioProfileKey = "jayant";

export function normalizeHost(host?: string | null): string {
  if (!host) return "";
  const [hostname] = host.toLowerCase().split(":");
  return hostname ?? "";
}

export function resolvePortfolioProfile(
  host?: string | null,
): PortfolioProfileKey {
  const normalizedHost = normalizeHost(host);

  const mappedHostProfile =
    normalizedHost && normalizedHost in HOSTNAME_MAP
      ? HOSTNAME_MAP[normalizedHost as keyof typeof HOSTNAME_MAP]
      : undefined;
  if (mappedHostProfile) return mappedHostProfile;

  if (normalizedHost && normalizedHost in PORTFOLIO_PROFILES) {
    return normalizedHost as PortfolioProfileKey;
  }

  const subdomain = normalizedHost.split(".")[0];
  const mappedSubdomainProfile =
    subdomain && subdomain in HOSTNAME_MAP
      ? HOSTNAME_MAP[subdomain as keyof typeof HOSTNAME_MAP]
      : undefined;
  if (mappedSubdomainProfile) {
    return mappedSubdomainProfile;
  }

  if (subdomain && subdomain in PORTFOLIO_PROFILES) {
    return subdomain as PortfolioProfileKey;
  }

  return DEFAULT_PORTFOLIO_PROFILE;
}

/**
 * Get legacy (hardcoded) portfolio data
 * Used as fallback when database is unavailable
 */
export function getLegacyPortfolioData(
  host?: string | null,
): LegacyPortfolioData {
  return PORTFOLIO_PROFILES[resolvePortfolioProfile(host)];
}

export function availablePortfolioProfiles() {
  return Object.keys(PORTFOLIO_PROFILES) as PortfolioProfileKey[];
}
