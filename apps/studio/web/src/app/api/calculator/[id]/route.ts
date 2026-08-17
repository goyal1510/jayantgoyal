import { NextRequest, NextResponse } from "next/server";

import { getVerifiedRequestUserId } from "@/lib/auth/verified-request-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabase
      .schema("studio")
      .from("currency_calculations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to delete calculation." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/calculator/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
