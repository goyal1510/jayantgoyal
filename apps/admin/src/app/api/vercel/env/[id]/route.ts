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

// PATCH - Update env var
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkSuperAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { project, value, target } = body as {
      project: VercelProjectKey;
      value: string;
      target?: string[];
    };

    if (!project) {
      return NextResponse.json(
        { error: "Missing project" },
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

    const updateBody: Record<string, unknown> = {};
    if (value !== undefined) updateBody.value = value;
    if (target !== undefined) updateBody.target = target;

    const res = await vercelFetch(`/v9/projects/${projectId}/env/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updateBody),
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to update env var" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating env var:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete env var
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkSuperAdminAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") as VercelProjectKey;

    if (!project || !["studio", "admin"].includes(project)) {
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

    const res = await vercelFetch(`/v9/projects/${projectId}/env/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(
        { error: data.error?.message || "Failed to delete env var" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting env var:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
