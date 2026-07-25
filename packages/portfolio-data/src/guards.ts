import type {
  PortfolioTable,
  PortfolioWorkCaseStudy,
  PortfolioPersonalInfo,
  PortfolioPrinciple,
  PortfolioSocialLink,
  SkillProficiency,
} from "./portfolio";
import { PORTFOLIO_TABLES } from "./portfolio";
import { PORTFOLIO_SECTION_KEYS, type PortfolioSectionKey } from "./sections";

export type PortfolioWriteOperation = "create" | "update";

const PORTFOLIO_GENERATED_KEYS = ["id", "created_at", "updated_at"] as const;

const PORTFOLIO_WRITE_KEYS: Record<PortfolioTable, readonly string[]> = {
  hero: [
    "name",
    "display_name",
    "role",
    "tagline",
    "blurb",
    "headline",
    "current_title",
    "availability",
    "resume_url",
    "github_username",
    "seo_title",
    "seo_description",
  ],
  about: [
    "summary",
    "personal",
    "headline",
    "objective",
    "story",
    "principles",
  ],
  education: [
    "school",
    "degree",
    "period",
    "location",
    "detail",
    "sort_order",
    "is_visible",
  ],
  experience: [
    "company",
    "role",
    "period",
    "location",
    "summary",
    "bullets",
    "sort_order",
    "is_visible",
  ],
  skill_categories: ["title", "description", "sort_order", "is_visible"],
  skills: [
    "category_id",
    "name",
    "proficiency",
    "evidence",
    "sort_order",
    "is_visible",
  ],
  work: [
    "name",
    "short_description",
    "tags",
    "github_link",
    "live_link",
    "slug",
    "eyebrow",
    "impact",
    "contribution",
    "year_label",
    "image_url",
    "image_alt",
    "case_study",
    "case_study_published",
    "sort_order",
    "is_visible",
  ],
  certificates: [
    "name",
    "description",
    "category",
    "issuer",
    "issued_at",
    "credential_id",
    "credential_url",
    "document_url",
    "preview_url",
    "image_alt",
    "sort_order",
    "is_visible",
  ],
  contact: ["email", "phone", "location", "socials"],
  nav_items: ["section_id", "label", "note", "sort_order", "is_visible"],
  section_content: [
    "section_key",
    "eyebrow",
    "headline",
    "accent",
    "description",
    "supporting_text",
    "is_visible",
  ],
};

const PORTFOLIO_REQUIRED_CREATE_KEYS: Partial<
  Record<PortfolioTable, readonly string[]>
> = {
  hero: [
    "name",
    "display_name",
    "role",
    "tagline",
    "blurb",
    "headline",
    "current_title",
    "availability",
    "resume_url",
    "github_username",
    "seo_title",
    "seo_description",
  ],
  about: ["summary", "headline", "objective"],
  education: ["school", "degree", "period"],
  experience: ["company", "role", "period"],
  skill_categories: ["title", "description"],
  skills: ["category_id", "name", "proficiency", "evidence"],
  work: [
    "name",
    "short_description",
    "slug",
    "eyebrow",
    "impact",
    "contribution",
    "year_label",
    "image_url",
    "image_alt",
  ],
  certificates: [
    "name",
    "category",
    "issuer",
    "document_url",
    "preview_url",
    "image_alt",
  ],
  contact: ["email", "phone", "location"],
  nav_items: ["section_id", "label"],
  section_content: ["section_key", "eyebrow"],
};

const PORTFOLIO_URL_KEYS: Partial<Record<PortfolioTable, readonly string[]>> = {
  hero: ["resume_url"],
  work: ["image_url", "github_link", "live_link"],
  certificates: ["credential_url", "document_url", "preview_url"],
};

/** Accept absolute web URLs and same-site paths used by uploaded assets. */
export function isValidPublicUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function readStringArray(value: unknown): string[] {
  return isStringArray(value) ? value : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validate the structural boundary shared by every Admin Portfolio write.
 * Database CHECK constraints remain the final authority for field semantics;
 * this guard prevents accidental table drift and generated-column writes before
 * a service-role request reaches Supabase.
 */
export function validatePortfolioWriteInput(
  table: string,
  value: unknown,
  operation: PortfolioWriteOperation,
): string[] {
  if (!PORTFOLIO_TABLES.includes(table as PortfolioTable)) {
    return [`Unknown Portfolio table: ${table}`];
  }

  if (!isRecord(value) || Array.isArray(value)) {
    return ["Payload must be a JSON object"];
  }

  const portfolioTable = table as PortfolioTable;
  const errors: string[] = [];
  const allowedKeys = PORTFOLIO_WRITE_KEYS[portfolioTable];
  const allowedSet = new Set(allowedKeys);

  for (const key of Object.keys(value)) {
    if ((PORTFOLIO_GENERATED_KEYS as readonly string[]).includes(key)) {
      errors.push(`${key} is generated and cannot be written`);
    } else if (!allowedSet.has(key)) {
      errors.push(`${key} is not writable on ${table}`);
    }
  }

  if (operation === "create") {
    for (const key of PORTFOLIO_REQUIRED_CREATE_KEYS[portfolioTable] ?? []) {
      const field = value[key];
      if (
        field === undefined ||
        field === null ||
        (typeof field === "string" && field.trim() === "")
      ) {
        errors.push(`${key} is required`);
      }
    }
  } else if (Object.keys(value).length === 0) {
    errors.push("Update payload cannot be empty");
  }

  for (const key of PORTFOLIO_URL_KEYS[portfolioTable] ?? []) {
    const field = value[key];
    if (field === undefined || field === null || field === "") continue;
    if (!isValidPublicUrl(field)) {
      errors.push(`${key} must be a valid http(s) URL or site path`);
    }
  }

  if (portfolioTable === "contact" && value.socials !== undefined) {
    if (!isSocialLinkArray(value.socials)) {
      errors.push(
        "socials must contain label, href, and icon_key for each link",
      );
    } else {
      value.socials.forEach((social, index) => {
        if (!isValidPublicUrl(social.href)) {
          errors.push(
            `socials[${index}].href must be a valid http(s) URL or site path`,
          );
        }
      });
    }
  }

  if (
    portfolioTable === "hero" &&
    typeof value.github_username === "string" &&
    value.github_username.trim() !== ""
  ) {
    if (
      typeof value.github_username !== "string" ||
      !/^[a-zA-Z0-9-]{1,39}$/.test(value.github_username.trim())
    ) {
      errors.push("github_username must be a valid GitHub username");
    }
  }

  if (
    portfolioTable === "work" &&
    typeof value.slug === "string" &&
    value.slug.trim() !== ""
  ) {
    if (
      typeof value.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)
    ) {
      errors.push("slug must use lowercase letters, numbers, and hyphens");
    }
  }

  if (
    portfolioTable === "work" &&
    value.case_study !== undefined &&
    value.case_study !== null &&
    !isWorkCaseStudyDraft(value.case_study)
  ) {
    errors.push(
      "case_study must use the expected project case-study fields and decision shape",
    );
  }

  if (
    portfolioTable === "work" &&
    value.case_study_published !== undefined &&
    typeof value.case_study_published !== "boolean"
  ) {
    errors.push("case_study_published must be a boolean");
  }

  if (
    portfolioTable === "work" &&
    operation === "create" &&
    value.case_study_published === true &&
    !isWorkCaseStudy(value.case_study)
  ) {
    errors.push("a complete case_study is required before publication");
  }

  if (
    portfolioTable === "contact" &&
    typeof value.email === "string" &&
    value.email.trim() !== ""
  ) {
    if (
      typeof value.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())
    ) {
      errors.push("email must be a valid email address");
    }
  }

  for (const key of ["sort_order"] as const) {
    if (value[key] === undefined) continue;
    if (
      typeof value[key] !== "number" ||
      !Number.isInteger(value[key]) ||
      value[key] < 0
    ) {
      errors.push(`${key} must be a non-negative integer`);
    }
  }

  return errors;
}

export function isPersonalInfoArray(
  value: unknown,
): value is PortfolioPersonalInfo[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.label === "string" &&
        typeof item.value === "string",
    )
  );
}

export function readPersonalInfo(value: unknown): PortfolioPersonalInfo[] {
  return isPersonalInfoArray(value) ? value : [];
}

export function isPrincipleArray(
  value: unknown,
): value is PortfolioPrinciple[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.copy === "string",
    )
  );
}

export function readPrinciples(value: unknown): PortfolioPrinciple[] {
  return isPrincipleArray(value) ? value : [];
}

export function isSocialLinkArray(
  value: unknown,
): value is PortfolioSocialLink[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.label === "string" &&
        typeof item.href === "string" &&
        typeof item.icon_key === "string",
    )
  );
}

export function readSocialLinks(value: unknown): PortfolioSocialLink[] {
  return isSocialLinkArray(value) ? value : [];
}

export function isWorkCaseStudy(
  value: unknown,
): value is PortfolioWorkCaseStudy {
  const textFields = [
    "problem",
    "solution",
    "architecture",
    "security",
    "tradeoffs",
    "outcome",
    "next_improvement",
  ] as const;

  return (
    isWorkCaseStudyDraft(value) &&
    textFields.every(
      (field) =>
        typeof value[field] === "string" && value[field].trim().length > 0,
    ) &&
    Array.isArray(value.decisions) &&
    value.decisions.length >= 2 &&
    value.decisions.every(
      (decision) =>
        isRecord(decision) &&
        typeof decision.title === "string" &&
        decision.title.trim().length > 0 &&
        typeof decision.detail === "string" &&
        decision.detail.trim().length > 0,
    )
  );
}

export function isWorkCaseStudyDraft(
  value: unknown,
): value is PortfolioWorkCaseStudy {
  if (!isRecord(value)) return false;

  const textFields = [
    "problem",
    "solution",
    "architecture",
    "security",
    "tradeoffs",
    "outcome",
    "next_improvement",
  ] as const;

  return (
    textFields.every((field) => typeof value[field] === "string") &&
    Array.isArray(value.decisions) &&
    value.decisions.every(
      (decision) =>
        isRecord(decision) &&
        typeof decision.title === "string" &&
        typeof decision.detail === "string",
    )
  );
}

export function readWorkCaseStudy(
  value: unknown,
): PortfolioWorkCaseStudy | null {
  return isWorkCaseStudy(value) ? value : null;
}

export function isSkillProficiency(value: string): value is SkillProficiency {
  return (
    value === "core" ||
    value === "strong" ||
    value === "working" ||
    value === "exploring"
  );
}

export function isPortfolioSectionKey(
  value: string,
): value is PortfolioSectionKey {
  return (PORTFOLIO_SECTION_KEYS as readonly string[]).includes(value);
}
