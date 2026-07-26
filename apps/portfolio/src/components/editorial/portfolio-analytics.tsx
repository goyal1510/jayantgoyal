"use client";

import { useEffect } from "react";

import {
  isPortfolioAnalyticsEvent,
  trackPortfolioEvent,
} from "@/lib/analytics/events";

export function PortfolioAnalytics() {
  useEffect(() => {
    function trackAnnotatedClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;

      const target = event.target.closest<HTMLElement>(
        "[data-analytics-event]",
      );
      if (!target) return;

      const eventName = target.dataset.analyticsEvent;
      if (!isPortfolioAnalyticsEvent(eventName)) return;

      trackPortfolioEvent(eventName, {
        source: target.dataset.analyticsSource,
        content_type: target.dataset.analyticsContentType,
        item_id: target.dataset.analyticsItemId,
        item_name: target.dataset.analyticsItemName,
        destination: target.dataset.analyticsDestination,
      });
    }

    document.addEventListener("click", trackAnnotatedClick);
    return () => document.removeEventListener("click", trackAnnotatedClick);
  }, []);

  return null;
}
