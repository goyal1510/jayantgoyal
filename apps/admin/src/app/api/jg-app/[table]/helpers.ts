import { NextResponse } from "next/server";
import {
  checkAdminAccess,
  getAdminClient,
  authorizeAndGetClient,
} from "../../portfolio/[table]/helpers";

export { checkAdminAccess, getAdminClient, authorizeAndGetClient };

export const ALLOWED_TABLES = ["blog_posts"];

export const TABLES_WITH_SORT_ORDER: string[] = [];

export function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  return null;
}
