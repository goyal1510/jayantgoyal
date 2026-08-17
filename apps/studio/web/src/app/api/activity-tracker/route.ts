import { NextRequest, NextResponse } from "next/server";

import { getVerifiedRequestUserId } from "@/lib/auth/verified-request-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACTIVITY_SELECT_COLUMNS = "id,name,user_id,created_at,is_active";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get("month")?.trim();
    const includeInactive = url.searchParams.get("include_inactive") === "true";

    let query = supabase
      .schema("studio")
      .from("activity_tracker_activities")
      .select(ACTIVITY_SELECT_COLUMNS)
      .eq("user_id", userId);

    // If includeInactive is true (for management page), show all activities
    if (!includeInactive) {
      // Filter based on month logic:
      // - Show activities that have entries in the current month (regardless of is_active)
      // - For months with no entries, only show active activities
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const startDate = `${month}-01`;
        const year = parseInt(month.split("-")[0]!);
        const monthNum = parseInt(month.split("-")[1]!);
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const endDate = `${month}-${daysInMonth.toString().padStart(2, "0")}`;

        // Get activities that have entries in this month
        const { data: entries } = await supabase
          .schema("studio")
          .from("activity_tracker_entries")
          .select("activity_id")
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate);

        const activityIdsWithEntries = new Set(
          entries?.map((e) => e.activity_id).filter(Boolean) || [],
        );

        // Show activities that either:
        // 1. Have entries in this month (regardless of is_active), OR
        // 2. Are active (for months with no entries yet)
        if (activityIdsWithEntries.size > 0) {
          // Fetch all activities first, then filter in memory
          const { data: allActivities } = await supabase
            .schema("studio")
            .from("activity_tracker_activities")
            .select(ACTIVITY_SELECT_COLUMNS)
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

          const filteredActivities =
            allActivities?.filter(
              (activity) =>
                activityIdsWithEntries.has(activity.id) ||
                activity.is_active === true,
            ) || [];

          return NextResponse.json({ activities: filteredActivities });
        } else {
          // No entries in this month, only show active activities
          query = query.eq("is_active", true);
        }
      } else {
        // No month specified, only show active activities
        query = query.eq("is_active", true);
      }
    }

    const { data: activities, error: fetchError } = await query.order(
      "created_at",
      {
        ascending: true,
      },
    );

    if (fetchError) {
      console.error("Error fetching activities:", fetchError);
      return NextResponse.json(
        { error: fetchError.message || "Unable to fetch activities." },
        { status: 500 },
      );
    }

    return NextResponse.json({ activities: activities || [] });
  } catch (error) {
    console.error("Error in GET /api/activity-tracker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Activity name is required." },
        { status: 400 },
      );
    }

    const { data: activity, error: insertError } = await supabase
      .schema("studio")
      .from("activity_tracker_activities")
      .insert({
        name: name.trim(),
        user_id: userId,
        is_active: true,
      })
      .select(ACTIVITY_SELECT_COLUMNS)
      .single();

    if (insertError) {
      console.error("Error creating activity:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Unable to create activity." },
        { status: 500 },
      );
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Error in POST /api/activity-tracker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
