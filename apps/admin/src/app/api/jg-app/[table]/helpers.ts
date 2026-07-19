import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  PORTFOLIO_BLOG_CMS_SELECT_COLUMNS,
  validatePortfolioBlogWriteInput,
} from "@repo/portfolio-data";
import {
  checkAdminAccess,
  getAdminClient,
  authorizeAndGetClient,
} from "../../portfolio/[table]/helpers";
import { getPortfolioPublicRevalidationPaths } from "@/lib/portfolio-revalidation";

export { checkAdminAccess, getAdminClient, authorizeAndGetClient };

export const ALLOWED_TABLES = ["blog_posts"];

export const TABLES_WITH_SORT_ORDER: string[] = [];

export function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  return null;
}

export function getBlogAdminSelectColumns() {
  return PORTFOLIO_BLOG_CMS_SELECT_COLUMNS;
}

export function validateBlogRequestBody(
  body: unknown,
  operation: "create" | "update",
) {
  const errors = validatePortfolioBlogWriteInput(body, operation);
  if (errors.length === 0) return null;

  return NextResponse.json(
    { error: "Invalid blog payload", fields: errors },
    { status: 400 },
  );
}

export function revalidateBlogPublicContent() {
  for (const path of getPortfolioPublicRevalidationPaths()) {
    revalidatePath(path);
  }

  revalidatePath("/blog/[slug]", "page");
}
