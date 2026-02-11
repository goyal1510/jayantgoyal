import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TABLES = [
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

async function checkAdminAccess() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { authorized: false, error: "Forbidden", status: 403 };
  }

  return { authorized: true, user };
}

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET - Fetch data from a portfolio table
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const authCheck = await checkAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let data;
    let error;

    if (id) {
      const result = await adminClient
        .schema("portfolio")
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Order by sort_order if the table has it
      const tablesWithSortOrder = [
        "education",
        "experience",
        "skill_categories",
        "skills",
        "tech_icons",
        "projects",
        "certificates",
        "nav_items",
      ];
      if (tablesWithSortOrder.includes(table)) {
        const result = await adminClient
          .schema("portfolio")
          .from(table)
          .select("*")
          .order("sort_order", { ascending: true });
        data = result.data;
        error = result.error;
      } else {
        const result = await adminClient
          .schema("portfolio")
          .from(table)
          .select("*");
        data = result.data;
        error = result.error;
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const authCheck = await checkAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { data, error } = await adminClient
      .schema("portfolio")
      .from(table)
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error creating portfolio data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update existing record
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const authCheck = await checkAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for update" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data, error } = await adminClient
      .schema("portfolio")
      .from(table)
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating portfolio data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const authCheck = await checkAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for delete" },
        { status: 400 }
      );
    }

    const { error } = await adminClient
      .schema("portfolio")
      .from(table)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
