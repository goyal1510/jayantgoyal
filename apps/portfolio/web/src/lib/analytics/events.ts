const PORTFOLIO_ANALYTICS_EVENTS = [
  "contact_intent",
  "file_download",
  "generate_lead",
  "select_content",
  "view_item",
] as const;

export type PortfolioAnalyticsEvent =
  (typeof PORTFOLIO_ANALYTICS_EVENTS)[number];

export type PortfolioAnalyticsParameters = Record<
  string,
  boolean | number | string | undefined
>;

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: PortfolioAnalyticsEvent,
      parameters?: Record<string, boolean | number | string>,
    ) => void;
  }
}

export function isPortfolioAnalyticsEvent(
  value: string | undefined,
): value is PortfolioAnalyticsEvent {
  return PORTFOLIO_ANALYTICS_EVENTS.includes(value as PortfolioAnalyticsEvent);
}

export function compactAnalyticsParameters(
  parameters: PortfolioAnalyticsParameters,
): Record<string, boolean | number | string> {
  return Object.fromEntries(
    Object.entries(parameters).filter(
      (entry): entry is [string, boolean | number | string] =>
        entry[1] !== undefined,
    ),
  );
}

export function trackPortfolioEvent(
  eventName: PortfolioAnalyticsEvent,
  parameters: PortfolioAnalyticsParameters = {},
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, compactAnalyticsParameters(parameters));
}
