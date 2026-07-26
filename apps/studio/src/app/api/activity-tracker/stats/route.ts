import { NextRequest, NextResponse } from "next/server";

import { getVerifiedRequestUserId } from "@/lib/auth/verified-request-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

function getMonthRange(value: string | null) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = value?.trim() || currentMonth;
  const match = MONTH_PATTERN.exec(month);
  const year = Number(match?.[1]);
  const monthNumber = Number(match?.[2]);

  if (!match || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  return {
    daysInMonth,
    startDate: `${month}-01`,
    endDate: `${month}-${String(daysInMonth).padStart(2, "0")}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const range = getMonthRange(request.nextUrl.searchParams.get("month"));
    if (!range) {
      return NextResponse.json(
        { error: "Month must use the YYYY-MM format." },
        { status: 400 },
      );
    }

    const [entriesResult, activitiesResult] = await Promise.all([
      supabase
        .schema("jg_app")
        .from("activity_tracker_entries")
        .select("activity_id,date,completed")
        .eq("user_id", userId)
        .gte("date", range.startDate)
        .lte("date", range.endDate),
      supabase
        .schema("jg_app")
        .from("activity_tracker_activities")
        .select("id,name,is_active,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    if (entriesResult.error) {
      console.error("Error fetching entries:", entriesResult.error);
      return NextResponse.json(
        {
          error: entriesResult.error.message || "Unable to fetch entries.",
        },
        { status: 500 },
      );
    }

    if (activitiesResult.error) {
      console.error("Error fetching activities:", activitiesResult.error);
      return NextResponse.json(
        {
          error:
            activitiesResult.error.message || "Unable to fetch activities.",
        },
        { status: 500 },
      );
    }

    const activityIdsWithEntries = new Set<string>();
    const completedByActivity = new Map<string, number>();
    const uniqueCompletedDays = new Set<string>();
    let totalCompletedEntries = 0;

    for (const entry of entriesResult.data ?? []) {
      if (entry.activity_id) {
        activityIdsWithEntries.add(entry.activity_id);
      }

      if (!entry.completed || !entry.activity_id) {
        continue;
      }

      completedByActivity.set(
        entry.activity_id,
        (completedByActivity.get(entry.activity_id) ?? 0) + 1,
      );
      uniqueCompletedDays.add(entry.date);
      totalCompletedEntries += 1;
    }

    const activities = (activitiesResult.data ?? []).filter(
      (activity) =>
        activity.is_active || activityIdsWithEntries.has(activity.id),
    );

    if (activities.length === 0) {
      return NextResponse.json({ stats: [] });
    }

    const stats = activities.map((activity) => {
      const completedDays = completedByActivity.get(activity.id) ?? 0;
      const completionRate =
        range.daysInMonth > 0 ? (completedDays / range.daysInMonth) * 100 : 0;

      return {
        activity_id: activity.id,
        activity_name: activity.name,
        total_days: range.daysInMonth,
        completed_days: completedDays,
        completion_rate: Math.round(completionRate * 100) / 100,
      };
    });

    const totalPossibleDays = activities.length * range.daysInMonth;
    const overallCompletionRate =
      totalPossibleDays > 0
        ? (totalCompletedEntries / totalPossibleDays) * 100
        : 0;

    return NextResponse.json({
      stats,
      overall: {
        total_activities: activities.length,
        total_days: range.daysInMonth,
        total_completed_days: totalCompletedEntries,
        unique_completed_days: uniqueCompletedDays.size,
        overall_completion_rate: Math.round(overallCompletionRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/activity-tracker/stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
