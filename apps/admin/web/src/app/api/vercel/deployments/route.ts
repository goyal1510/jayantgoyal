import { NextResponse } from "next/server";
import { vercelFetch, getProjectId } from "@/lib/vercel-server";
import type { VercelProjectKey } from "@/lib/types";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";

// GET - List deployments for a project
export async function GET(request: Request) {
  try {
    const authCheck = await authorizeAdminCapability(
      ADMIN_CAPABILITIES.deploymentsRead,
    );
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") as VercelProjectKey;
    const limit = searchParams.get("limit") || "20";

    if (!project || !["studio", "admin"].includes(project)) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    const projectId = getProjectId(project);
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID not configured" },
        { status: 500 },
      );
    }

    const res = await vercelFetch(
      `/v6/deployments?projectId=${projectId}&limit=${limit}`,
    );
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Vercel API error" },
        { status: res.status },
      );
    }

    return NextResponse.json({ deployments: data.deployments });
  } catch (error) {
    console.error("Error listing deployments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Redeploy or rollback
export async function POST(request: Request) {
  try {
    const authCheck = await authorizeAdminCapability(
      ADMIN_CAPABILITIES.deploymentsUpdate,
    );
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const body = await request.json();
    const { action, deploymentId, project, target } = body as {
      action: "redeploy" | "rollback";
      deploymentId: string;
      project: VercelProjectKey;
      target?: string;
    };

    if (!action || !deploymentId || !project) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const projectId = getProjectId(project);
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID not configured" },
        { status: 500 },
      );
    }

    if (action === "redeploy") {
      const res = await vercelFetch("/v13/deployments", {
        method: "POST",
        body: JSON.stringify({
          name: project === "studio" ? "studio" : "admin",
          deploymentId,
          target: target || "production",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(
          { error: data.error?.message || "Redeploy failed" },
          { status: res.status },
        );
      }

      return NextResponse.json(data);
    }

    if (action === "rollback") {
      const res = await vercelFetch(
        `/v9/work/${projectId}/rollback/${deploymentId}`,
        { method: "POST" },
      );

      if (!res.ok) {
        const data = await res.json();
        return NextResponse.json(
          { error: data.error?.message || "Rollback failed" },
          { status: res.status },
        );
      }

      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error with deployment action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
