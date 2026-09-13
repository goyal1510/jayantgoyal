import { NextResponse } from "next/server";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";
import { loadCareerOverview } from "@/lib/career-server";

export async function GET() {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.careerRead);
  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    return NextResponse.json(await loadCareerOverview());
  } catch (error) {
    console.error("Unable to load career pipeline:", error);
    return NextResponse.json(
      { error: "Unable to load the career pipeline." },
      { status: 500 },
    );
  }
}
