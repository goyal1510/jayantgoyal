import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const ALLOWED_TABLES = [
  "hero",
  "about",
  "education",
  "experience",
  "skill_categories",
  "skills",
  "tech_icons",
  "projects",
  "certificates",
  "contact",
  "nav_items",
];

export const TABLES_WITH_SORT_ORDER = [
  "education",
  "experience",
  "skill_categories",
  "skills",
  "tech_icons",
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return null;
  }

  return createSupabaseAdminClient();
}

export function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  return null;
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
