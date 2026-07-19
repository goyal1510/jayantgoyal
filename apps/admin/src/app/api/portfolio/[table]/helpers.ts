import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@repo/auth/service-role";
import {
  PORTFOLIO_ADMIN_SELECT_COLUMNS,
  PORTFOLIO_TABLES,
  type PortfolioTable,
  validatePortfolioWriteInput,
} from "@repo/portfolio-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPortfolioPublicRevalidationPaths } from "@/lib/portfolio-revalidation";

export const ALLOWED_TABLES = PORTFOLIO_TABLES;

export const TABLES_WITH_SORT_ORDER = [
  "education",
  "experience",
  "skill_categories",
  "skills",
  "projects",
  "certificates",
  "nav_items",
];

export async function checkAdminAccess() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { authorized: false as const, error: "Forbidden", status: 403 };
  }

  return { authorized: true as const, user };
}

export function getAdminClient() {
  try {
    return createSupabaseServiceRoleClient();
  } catch {
    return null;
  }
}

export function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table as PortfolioTable)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  return null;
}

export function getPortfolioAdminSelectColumns(table: string) {
  return PORTFOLIO_ADMIN_SELECT_COLUMNS[table as PortfolioTable];
}

export function validatePortfolioRequestBody(
  table: string,
  body: unknown,
  operation: "create" | "update",
) {
  const errors = validatePortfolioWriteInput(table, body, operation);
  if (errors.length === 0) return null;

  return NextResponse.json(
    {
      error: "Invalid Portfolio payload",
      fields: errors,
    },
    { status: 400 },
  );
}

export function revalidatePortfolioPublicContent() {
  for (const path of getPortfolioPublicRevalidationPaths()) {
    revalidatePath(path);
  }

  // Dynamic article pages cannot be enumerated from the mutation payload. The
  // pattern invalidates every public Blog detail page without exposing CMS
  // state to the client.
  revalidatePath("/blog/[slug]", "page");
}

export async function authorizeAndGetClient() {
  const authCheck = await checkAdminAccess();
  if (!authCheck.authorized) {
    return {
      error: NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      ),
    };
  }

  const adminClient = getAdminClient();
  if (!adminClient) {
    return {
      error: NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      ),
    };
  }

  return { client: adminClient };
}
