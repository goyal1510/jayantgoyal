const FALLBACK_SITE_URL = "https://portfolio.jayantgoyal.com";

function normalizeSiteUrl(value?: string): string {
  if (!value) return FALLBACK_SITE_URL;

  try {
    return new URL(value).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const PERSON_NAME = "Jayant Goyal";
export const SITE_NAME = `${PERSON_NAME} Portfolio`;
export const SITE_TITLE = `${PERSON_NAME} | Full-Stack Developer`;
export const SITE_DESCRIPTION =
  "The portfolio of Jayant Goyal, a full-stack developer building reliable products with Next.js, React, TypeScript, and Supabase.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
export const LAST_SIGNIFICANT_UPDATE = "2026-07-17T00:00:00.000Z";

export function isCanonicalProductionHost(host: string | null): boolean {
  const hostname = host?.split(":")[0]?.toLowerCase();
  return hostname === "jayantgoyal.com" || hostname === "www.jayantgoyal.com";
}
