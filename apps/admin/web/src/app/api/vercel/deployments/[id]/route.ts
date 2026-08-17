import { NextResponse } from "next/server";
import { vercelFetch } from "@/lib/vercel-server";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";

// GET - Deployment detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const res = await vercelFetch(`/v13/deployments/${id}`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Vercel API error" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching deployment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
