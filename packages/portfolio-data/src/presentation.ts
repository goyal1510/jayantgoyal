import {
  PORTFOLIO_PUBLIC_NAVIGATION_KEYS,
  PORTFOLIO_SECTION_KEYS,
  type PortfolioSectionKey,
} from "./sections";
import type {
  PortfolioNavigationRecord,
  PortfolioSectionContentRecord,
} from "./portfolio";

export interface PortfolioSectionPresentationCopyInput {
  eyebrow: string;
  headline: string;
  accent: string;
  description: string;
  supporting_text: string;
  is_visible: boolean;
}

export interface PortfolioSectionPresentationNavigationInput {
  label: string;
  note: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface PortfolioSectionPresentationInput {
  section_key: PortfolioSectionKey;
  copy: PortfolioSectionPresentationCopyInput;
  navigation: PortfolioSectionPresentationNavigationInput | null;
}

export interface PortfolioSectionPresentationResponse {
  sectionContent: PortfolioSectionContentRecord;
  navigation: PortfolioNavigationRecord | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  prefix: string,
): string[] {
  const allowed = new Set(keys);
  return Object.keys(value)
    .filter((key) => !allowed.has(key))
    .map((key) => `${prefix}.${key} is not writable`);
}

/**
 * Validate the cross-table presentation payload before it reaches the Admin
 * service-role route. The database remains responsible for its own CHECK and
 * foreign-key constraints; this guard keeps the browser contract explicit.
 */
export function validatePortfolioSectionPresentationInput(
  value: unknown,
): string[] {
  if (!isRecord(value)) return ["Payload must be a JSON object"];

  const errors: string[] = [];
  const sectionKey = value.section_key;
  if (
    typeof sectionKey !== "string" ||
    !PORTFOLIO_SECTION_KEYS.includes(sectionKey as PortfolioSectionKey)
  ) {
    errors.push("section_key must be a supported Portfolio section");
  }

  const copy = value.copy;
  if (!isRecord(copy)) {
    errors.push("copy is required");
  } else {
    errors.push(
      ...hasOnlyKeys(
        copy,
        [
          "eyebrow",
          "headline",
          "accent",
          "description",
          "supporting_text",
          "is_visible",
        ],
        "copy",
      ),
    );
    for (const field of [
      "eyebrow",
      "headline",
      "accent",
      "description",
      "supporting_text",
    ]) {
      if (typeof copy[field] !== "string") {
        errors.push(`copy.${field} must be a string`);
      }
    }
    if (typeof copy.eyebrow === "string" && copy.eyebrow.trim() === "") {
      errors.push("copy.eyebrow is required");
    }
    if (typeof copy.is_visible !== "boolean") {
      errors.push("copy.is_visible must be a boolean");
    }
  }

  if (!("navigation" in value)) {
    errors.push("navigation is required");
  } else if (value.navigation !== null) {
    const navigation = value.navigation;
    if (
      typeof sectionKey === "string" &&
      PORTFOLIO_SECTION_KEYS.includes(sectionKey as PortfolioSectionKey) &&
      !PORTFOLIO_PUBLIC_NAVIGATION_KEYS.includes(
        sectionKey as (typeof PORTFOLIO_PUBLIC_NAVIGATION_KEYS)[number],
      )
    ) {
      errors.push("navigation is only supported for public navigation sections");
    }
    if (!isRecord(navigation)) {
      errors.push("navigation must be an object or null");
    } else {
      errors.push(
        ...hasOnlyKeys(
          navigation,
          ["label", "note", "sort_order", "is_visible"],
          "navigation",
        ),
      );
      if (
        typeof navigation.label !== "string" ||
        navigation.label.trim() === ""
      ) {
        errors.push("navigation.label is required");
      }
      if (navigation.note !== null && typeof navigation.note !== "string") {
        errors.push("navigation.note must be a string or null");
      }
      if (
        typeof navigation.sort_order !== "number" ||
        !Number.isInteger(navigation.sort_order) ||
        navigation.sort_order < 0
      ) {
        errors.push("navigation.sort_order must be a non-negative integer");
      }
      if (typeof navigation.is_visible !== "boolean") {
        errors.push("navigation.is_visible must be a boolean");
      }
    }
  }

  return errors;
}
