import type { PortfolioSectionKey } from "./sections";

export const PORTFOLIO_SECTION_LABEL_KEYS = [
  "factBuilding",
  "factWorkingAs",
  "factBasedIn",
  "readCta",
  "countNoun",
  "deliveryLabel",
  "deliveryValue",
] as const;

export type PortfolioSectionLabelKey =
  (typeof PORTFOLIO_SECTION_LABEL_KEYS)[number];

export type PortfolioSectionCopyField =
  | "eyebrow"
  | "headline"
  | "accent"
  | "description"
  | "supporting_text";

export type PortfolioSectionFieldHint = {
  label: string;
  help: string;
};

export type PortfolioSectionLabelField = PortfolioSectionFieldHint & {
  key: PortfolioSectionLabelKey;
};

const DEFAULT_COPY_HINTS: Record<
  PortfolioSectionCopyField,
  PortfolioSectionFieldHint
> = {
  eyebrow: {
    label: "Eyebrow",
    help: "Small framing label above the section. A slash can still split the public index and title.",
  },
  headline: {
    label: "Public headline",
    help: "The section's main editorial statement.",
  },
  accent: {
    label: "Primary action",
    help: "The main highlighted phrase or button label for this section.",
  },
  description: {
    label: "Description",
    help: "Supporting paragraph shown with the headline.",
  },
  supporting_text: {
    label: "Supporting text",
    help: "Secondary copy for this section. Keep one job in this field.",
  },
};

const COPY_HINT_OVERRIDES: Partial<
  Record<
    PortfolioSectionKey,
    Partial<Record<PortfolioSectionCopyField, PortfolioSectionFieldHint>>
  >
> = {
  hero: {
    headline: {
      label: "Section headline",
      help: "Not the home page title. The profile headline owns the hero h1.",
    },
    accent: {
      label: "Resume action",
      help: "Label for the hero résumé link.",
    },
    supporting_text: {
      label: "Availability kicker",
      help: "Short line above the current availability note.",
    },
  },
  home: {
    accent: {
      label: "Explore work action",
      help: "Hero link into the featured work section.",
    },
    supporting_text: {
      label: "Back to home",
      help: "Work archive link back to the Portfolio home.",
    },
  },
  writing: {
    accent: {
      label: "All articles action",
      help: "Link from the home writing block to the writing index.",
    },
    supporting_text: {
      label: "Empty-state copy",
      help: "Shown when no writing posts are published yet.",
    },
  },
  work: {
    accent: {
      label: "Archive action",
      help: "Link from featured work and About into the work archive.",
    },
    supporting_text: {
      label: "Featured work note",
      help: "Caption next to the archive link on the home work block.",
    },
  },
  contact: {
    accent: {
      label: "Discuss action",
      help: "Mail and discuss-a-product label.",
    },
    supporting_text: {
      label: "Get in touch",
      help: "Header and home contact-band action.",
    },
  },
  engineering: {
    eyebrow: {
      label: "Ownership label",
      help: "First proof-strip heading.",
    },
    headline: {
      label: "Ownership value",
      help: "First proof-strip value.",
    },
    accent: {
      label: "Depth label",
      help: "Third proof-strip heading.",
    },
    description: {
      label: "Depth value",
      help: "Third proof-strip value.",
    },
    supporting_text: {
      label: "Unused supporting text",
      help: "Leave empty. Delivery proof uses the named labels below.",
    },
  },
};

export const PORTFOLIO_SECTION_LABEL_FIELDS: Partial<
  Record<PortfolioSectionKey, readonly PortfolioSectionLabelField[]>
> = {
  hero: [
    {
      key: "factBuilding",
      label: "Focus fact label",
      help: "Left-column label for the current product focus.",
    },
    {
      key: "factWorkingAs",
      label: "Role fact label",
      help: "Left-column label for the current role.",
    },
    {
      key: "factBasedIn",
      label: "Location fact label",
      help: "Left-column label for the current location.",
    },
  ],
  writing: [
    {
      key: "readCta",
      label: "Read article action",
      help: "Card action on each home writing preview.",
    },
  ],
  work: [
    {
      key: "countNoun",
      label: "Work count noun",
      help: "Noun after the public work count on the archive hero.",
    },
  ],
  engineering: [
    {
      key: "deliveryLabel",
      label: "Delivery label",
      help: "Fourth proof-strip heading.",
    },
    {
      key: "deliveryValue",
      label: "Delivery value",
      help: "Fourth proof-strip value.",
    },
  ],
};

const LABEL_KEY_SET = new Set<string>(PORTFOLIO_SECTION_LABEL_KEYS);

export function getSectionCopyHints(
  sectionKey: PortfolioSectionKey,
): Record<PortfolioSectionCopyField, PortfolioSectionFieldHint> {
  const overrides = COPY_HINT_OVERRIDES[sectionKey] ?? {};
  return {
    eyebrow: overrides.eyebrow ?? DEFAULT_COPY_HINTS.eyebrow,
    headline: overrides.headline ?? DEFAULT_COPY_HINTS.headline,
    accent: overrides.accent ?? DEFAULT_COPY_HINTS.accent,
    description: overrides.description ?? DEFAULT_COPY_HINTS.description,
    supporting_text:
      overrides.supporting_text ?? DEFAULT_COPY_HINTS.supporting_text,
  };
}

export function emptySectionLabels(
  sectionKey: PortfolioSectionKey,
): Record<string, string> {
  const fields = PORTFOLIO_SECTION_LABEL_FIELDS[sectionKey] ?? [];
  return Object.fromEntries(fields.map((field) => [field.key, ""]));
}

export function normalizeSectionLabels(
  value: unknown,
): Record<string, string> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const labels: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") return null;
    labels[key] = entry;
  }
  return labels;
}

export function validateSectionLabels(
  sectionKey: PortfolioSectionKey,
  labels: Record<string, string>,
): string[] {
  const allowed = new Set(
    (PORTFOLIO_SECTION_LABEL_FIELDS[sectionKey] ?? []).map(
      (field) => field.key,
    ),
  );
  const errors: string[] = [];

  for (const key of Object.keys(labels)) {
    if (
      !LABEL_KEY_SET.has(key) ||
      !allowed.has(key as PortfolioSectionLabelKey)
    ) {
      errors.push(`copy.labels.${key} is not writable for ${sectionKey}`);
    }
    if (typeof labels[key] !== "string") {
      errors.push(`copy.labels.${key} must be a string`);
    }
  }

  return errors;
}

export function getSectionLabel(
  labels: Record<string, string> | undefined,
  key: PortfolioSectionLabelKey,
  fallback: string,
): string {
  const value = labels?.[key]?.trim();
  return value || fallback;
}
