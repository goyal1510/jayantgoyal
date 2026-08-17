import { NextRequest, NextResponse } from "next/server";

import { getVerifiedRequestUserId } from "@/lib/auth/verified-request-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACTIVITY_SELECT_COLUMNS = "id,name,user_id,created_at,is_active";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: activityId } = await params;

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { is_active, name } = body ?? {};

    const updateData: { is_active?: boolean; name?: string } = {};

    if (typeof is_active === "boolean") {
      updateData.is_active = is_active;
    }

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field (name or is_active) is required." },
        { status: 400 },
      );
    }

    const { data: updatedActivity, error: updateError } = await supabase
      .schema("studio")
      .from("activity_tracker_activities")
      .update(updateData)
      .eq("id", activityId)
      .eq("user_id", userId)
      .select(ACTIVITY_SELECT_COLUMNS)
      .maybeSingle();

    if (updateError) {
      console.error("Error updating activity:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Unable to update activity." },
        { status: 500 },
      );
    }

    if (!updatedActivity) {
      return NextResponse.json(
        { error: "Activity not found or unauthorized." },
        { status: 404 },
      );
    }

    return NextResponse.json({ activity: updatedActivity });
  } catch (error) {
    console.error("Error in PATCH /api/activity-tracker/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const { id: activityId } = await params;
    const { data: deletedActivity, error } = await supabase
      .schema("studio")
      .from("activity_tracker_activities")
      .delete()
      .eq("id", activityId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error deleting activity:", error);
      return NextResponse.json(
        { error: error.message || "Unable to delete activity." },
        { status: 500 },
      );
    }

    if (!deletedActivity) {
      return NextResponse.json(
        { error: "Activity not found or unauthorized." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/activity-tracker/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
