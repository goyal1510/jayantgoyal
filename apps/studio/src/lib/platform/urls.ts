import { applicationOrigin, applicationUrl } from "@repo/platform";

export const PORTFOLIO_URL = applicationOrigin(
  "portfolio",
  process.env.NEXT_PUBLIC_PORTFOLIO_URL,
);

export const STUDIO_URL = applicationOrigin(
  "studio",
  process.env.NEXT_PUBLIC_STUDIO_URL,
);

export function portfolioUrl(pathname = "/") {
  return applicationUrl("portfolio", pathname, PORTFOLIO_URL);
}

export function studioUrl(pathname = "/") {
  return applicationUrl("studio", pathname, STUDIO_URL);
}
