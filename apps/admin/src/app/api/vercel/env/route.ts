import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { vercelFetch, getProjectId } from "@/lib/vercel-server";
import type { VercelProjectKey } from "@/lib/types";

async function checkSuperAdminAccess() {
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

  if (!profile || profile.role !== "super_admin") {
    return { authorized: false as const, error: "Forbidden", status: 403 };
  }

  return { authorized: true as const };
}

// GET - List env vars
export async function GET(request: Request) {
  try {
    const authCheck = await checkSuperAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") as VercelProjectKey;

    if (!project || !["jg", "admin"].includes(project)) {
      return NextResponse.json(
        { error: "Invalid project" },
        { status: 400 }
      );
    }

    const projectId = getProjectId(project);
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID not configured" },
        { status: 500 }
      );
    }

    const res = await vercelFetch(`/v10/projects/${projectId}/env`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Vercel API error" },
        { status: res.status }
      );
    }

    return NextResponse.json({ envs: data.envs });
  } catch (error) {
    console.error("Error listing env vars:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create env var
export async function POST(request: Request) {
  try {
    const authCheck = await checkSuperAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const { project, key, value, type, target } = body as {
      project: VercelProjectKey;
      key: string;
      value: string;
      type: string;
      target: string[];
    };

    if (!project || !key || !value || !type || !target) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const projectId = getProjectId(project);
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID not configured" },
        { status: 500 }
      );
    }

    const res = await vercelFetch(`/v10/projects/${projectId}/env`, {
      method: "POST",
      body: JSON.stringify({ key, value, type, target }),
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to create env var" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating env var:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
