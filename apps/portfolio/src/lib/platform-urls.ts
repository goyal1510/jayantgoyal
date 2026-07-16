const DEFAULT_STUDIO_URL = "https://studio.jayantgoyal.com";
const LEGACY_PLATFORM_HOSTS = new Set([
  "jayantgoyal.com",
  "www.jayantgoyal.com",
]);

function studioOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_STUDIO_URL ?? DEFAULT_STUDIO_URL)
      .origin;
  } catch {
    return DEFAULT_STUDIO_URL;
  }
}

export function resolveProjectUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!LEGACY_PLATFORM_HOSTS.has(url.hostname)) return value;

    return new URL(
      `${url.pathname}${url.search}${url.hash}`,
      studioOrigin(),
    ).toString();
  } catch {
    return value;
  }
}
