import { isValidPublicUrl } from "./guards";

export interface PortfolioBlogPostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  tags: string[];
  is_visible: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioBlogPreviewRow {
  title: string;
  slug: string;
  excerpt: string | null;
  tags: unknown;
  published_at: string | null;
}

/** Public list shape; publication flags are query predicates, not view data. */
export type PortfolioBlogListRecord = Omit<
  PortfolioBlogPostRecord,
  "content" | "is_visible" | "is_published"
>;

/** Public article shape; publication flags are query predicates, not view data. */
export type PortfolioBlogDetailRecord = Omit<
  PortfolioBlogPostRecord,
  "is_visible" | "is_published"
>;

export type PortfolioBlogPublicationState = "draft" | "published" | "hidden";

/** Keep CMS labels and public eligibility in one shared contract. */
export function getBlogPublicationState(
  post: Pick<
    PortfolioBlogPostRecord,
    "is_published" | "is_visible" | "published_at"
  >,
): PortfolioBlogPublicationState {
  if (!post.is_visible) return "hidden";
  return post.is_published && post.published_at ? "published" : "draft";
}

export function isPublicBlogPost(
  post: Pick<
    PortfolioBlogPostRecord,
    "is_published" | "is_visible" | "published_at"
  >,
): boolean {
  return Boolean(post.is_visible && post.is_published && post.published_at);
}

export type PortfolioBlogWriteInput = Omit<
  PortfolioBlogPostRecord,
  "id" | "created_at" | "updated_at"
>;

export type PortfolioBlogUpdateInput = Partial<PortfolioBlogWriteInput>;

export type PortfolioBlogWriteOperation = "create" | "update";

const PORTFOLIO_BLOG_GENERATED_KEYS = [
  "id",
  "created_at",
  "updated_at",
] as const;

const PORTFOLIO_BLOG_WRITE_KEYS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "cover_image",
  "tags",
  "is_visible",
  "is_published",
  "published_at",
] as const;

/** Validate the runtime boundary for the Admin Writing workspace. */
export function validatePortfolioBlogWriteInput(
  value: unknown,
  operation: PortfolioBlogWriteOperation,
): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return ["Payload must be a JSON object"];
  }

  const record = value as Record<string, unknown>;
  const errors: string[] = [];
  const allowedKeys = new Set<string>(PORTFOLIO_BLOG_WRITE_KEYS);

  for (const key of Object.keys(record)) {
    if ((PORTFOLIO_BLOG_GENERATED_KEYS as readonly string[]).includes(key)) {
      errors.push(`${key} is generated and cannot be written`);
    } else if (!allowedKeys.has(key)) {
      errors.push(`${key} is not writable on blog_posts`);
    }
  }

  if (operation === "create") {
    for (const key of ["title", "slug", "content"] as const) {
      const field = record[key];
      if (
        field === undefined ||
        field === null ||
        (typeof field === "string" && field.trim() === "")
      ) {
        errors.push(`${key} is required`);
      }
    }
  } else if (Object.keys(record).length === 0) {
    errors.push("Update payload cannot be empty");
  }

  if (record.slug !== undefined) {
    if (typeof record.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) {
      errors.push("slug must use lowercase letters, numbers, and hyphens");
    }
  }

  if (
    record.cover_image !== undefined &&
    record.cover_image !== null &&
    record.cover_image !== "" &&
    !isValidPublicUrl(record.cover_image)
  ) {
    errors.push("cover_image must be a valid http(s) URL or site path");
  }

  if (record.is_published === true) {
    if (typeof record.content !== "string" || record.content.trim() === "") {
      if (!errors.includes("content is required")) {
        errors.push("content is required when publishing");
      }
    }
    if (!record.published_at) {
      errors.push("published_at is required when publishing");
    }
  }

  return errors;
}

export const PORTFOLIO_BLOG_SELECT_COLUMNS =
  "id, title, slug, excerpt, cover_image, tags, published_at, created_at, updated_at";

export const PORTFOLIO_BLOG_DETAIL_SELECT_COLUMNS =
  "id, title, slug, excerpt, content, cover_image, tags, published_at, created_at, updated_at";

export const PORTFOLIO_BLOG_CMS_SELECT_COLUMNS =
  "id, title, slug, excerpt, content, cover_image, tags, is_visible, is_published, published_at, created_at, updated_at";

export const PORTFOLIO_BLOG_PREVIEW_SELECT_COLUMNS =
  "title, slug, excerpt, tags, published_at";
