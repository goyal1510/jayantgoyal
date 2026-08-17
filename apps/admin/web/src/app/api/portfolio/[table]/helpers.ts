import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@jayantgoyal/web-auth/service-role";
import {
  PORTFOLIO_ADMIN_SELECT_COLUMNS,
  PORTFOLIO_TABLES,
  type PortfolioTable,
  validatePortfolioWriteInput,
} from "@jayantgoyal/portfolio-contracts";
import { getPortfolioPublicRevalidationPaths } from "@/lib/portfolio-revalidation";
import { authorizeAdminCapability } from "@/lib/access";
import type { CapabilityKey } from "@jayantgoyal/web-auth/authorization";

const ALLOWED_TABLES = PORTFOLIO_TABLES;

export const TABLES_WITH_SORT_ORDER = [
  "education",
  "experience",
  "skill_categories",
  "skills",
  "work",
  "certificates",
  "nav_items",
];

function getAdminClient() {
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
  // pattern invalidates every public Writing detail page without exposing CMS
  // state to the client.
  revalidatePath("/writing/[slug]", "page");
}

export async function authorizeAndGetClient(capability: CapabilityKey) {
  const authCheck = await authorizeAdminCapability(capability);
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
