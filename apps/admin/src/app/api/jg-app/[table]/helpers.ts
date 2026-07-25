import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  PORTFOLIO_WRITING_CMS_SELECT_COLUMNS,
  validatePortfolioWritingWriteInput,
} from "@repo/portfolio-data";
import {
  checkAdminAccess,
  getAdminClient,
  authorizeAndGetClient,
} from "../../portfolio/[table]/helpers";
import { getPortfolioPublicRevalidationPaths } from "@/lib/portfolio-revalidation";

export { checkAdminAccess, getAdminClient, authorizeAndGetClient };

export const ALLOWED_TABLES = ["writing_posts"];

export const TABLES_WITH_SORT_ORDER: string[] = [];

export function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  return null;
}

export function getWritingAdminSelectColumns() {
  return PORTFOLIO_WRITING_CMS_SELECT_COLUMNS;
}

export function validateWritingRequestBody(
  body: unknown,
  operation: "create" | "update",
) {
  const errors = validatePortfolioWritingWriteInput(body, operation);
  if (errors.length === 0) return null;

  return NextResponse.json(
    { error: "Invalid writing payload", fields: errors },
    { status: 400 },
  );
}

export function revalidateWritingPublicContent() {
  for (const path of getPortfolioPublicRevalidationPaths()) {
    revalidatePath(path);
  }

  revalidatePath("/writing/[slug]", "page");
}
