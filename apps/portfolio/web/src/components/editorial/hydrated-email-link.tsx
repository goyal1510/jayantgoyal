"use client";

import { Mail } from "lucide-react";

import { buildEmailLinkPresentation } from "./hydrated-email-link-state";
import { useHasHydrated } from "./use-has-hydrated";

export function HydratedEmailLink({
  emailCodePoints,
  variant,
}: {
  emailCodePoints: number[];
  variant: "detail" | "icon";
}) {
  const hasHydrated = useHasHydrated();
  const { detailLabel, href } = buildEmailLinkPresentation(
    emailCodePoints,
    hasHydrated,
  );

  if (variant === "icon") {
    return (
      <a href={href} aria-label="Email">
        <Mail aria-hidden="true" />
      </a>
    );
  }

  return (
    <a
      href={href}
      aria-label="Email"
      data-analytics-event="contact_intent"
      data-analytics-source="contact_page"
      data-analytics-destination="email"
    >
      <Mail aria-hidden="true" />
      <span>
        <small>Email</small>
        {detailLabel}
      </span>
    </a>
  );
}
