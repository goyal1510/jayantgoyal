const DEFAULT_PORTFOLIO_URL = "https://jayantgoyal.com";

function normalizeOrigin(value: string | undefined, fallback: string) {
  try {
    return new URL(value ?? fallback).origin;
  } catch {
    return fallback;
  }
}

export const PORTFOLIO_URL = normalizeOrigin(
  process.env.NEXT_PUBLIC_PORTFOLIO_URL,
  DEFAULT_PORTFOLIO_URL,
);

export function portfolioUrl(pathname = "/") {
  return new URL(pathname, `${PORTFOLIO_URL}/`).toString();
}
