import { NextRequest, NextResponse } from "next/server";

import { getVerifiedRequestUserId } from "@/lib/auth/verified-request-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ENTRY_SELECT_COLUMNS = "id,activity_id,date,completed,user_id,created_at";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getVerifiedRequestUserId(request, supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const activityId = url.searchParams.get("activity_id")?.trim();
    const month = url.searchParams.get("month")?.trim();
    const datesParam = url.searchParams.get("dates")?.trim();

    let query = supabase
      .schema("studio")
      .from("activity_tracker_entries")
      .select(ENTRY_SELECT_COLUMNS)
      .eq("user_id", userId);

    if (activityId) {
      query = query.eq("activity_id", activityId);
    }

    // Filter by specific dates (comma-separated YYYY-MM-DD format)
    if (datesParam) {
      const dates = datesParam
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      if (dates.length > 0) {
        query = query.in("date", dates);
      }
    }
    // Filter by month (YYYY-MM format) - fallback if dates not provided
    else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const startDate = `${month}-01`;
      const year = parseInt(month.split("-")[0]!);
      const monthNum = parseInt(month.split("-")[1]!);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const endDate = `${month}-${daysInMonth.toString().padStart(2, "0")}`;

      query = query.gte("date", startDate).lte("date", endDate);
    }

    const { data: entries, error: fetchError } = await query.order("date", {
      ascending: true,
    });

    if (fetchError) {
      console.error("Error fetching entries:", fetchError);
      return NextResponse.json(
        { error: fetchError.message || "Unable to fetch entries." },
        { status: 500 },
      );
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error("Error in GET /api/activity-tracker/entries:", error);
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
    const { activity_id, date, completed } = body ?? {};

    if (!activity_id || typeof activity_id !== "string") {
      return NextResponse.json(
        { error: "Activity ID is required." },
        { status: 400 },
      );
    }

    if (
      !date ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return NextResponse.json(
        { error: "Valid date (YYYY-MM-DD) is required." },
        { status: 400 },
      );
    }

    // Validate that the date is editable (today, yesterday, or day before yesterday)
    // Use local time, not UTC
    const formatDateLocal = (d: Date): string => {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    const todayStr = formatDateLocal(today);
    const yesterdayStr = formatDateLocal(yesterday);
    const dayBeforeYesterdayStr = formatDateLocal(dayBeforeYesterday);

    if (
      date !== todayStr &&
      date !== yesterdayStr &&
      date !== dayBeforeYesterdayStr
    ) {
      return NextResponse.json(
        {
          error:
            "You can only update entries for today, yesterday, or the day before yesterday.",
        },
        { status: 400 },
      );
    }

    const { data: ownedActivity, error: activityError } = await supabase
      .schema("studio")
      .from("activity_tracker_activities")
      .select("id")
      .eq("id", activity_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (activityError) {
      console.error("Error validating activity entry:", activityError);
      return NextResponse.json(
        {
          error: activityError.message || "Unable to validate activity entry.",
        },
        { status: 500 },
      );
    }

    if (!ownedActivity) {
      return NextResponse.json(
        { error: "Activity not found or unauthorized." },
        { status: 404 },
      );
    }

    const { data: entry, error: upsertError } = await supabase
      .schema("studio")
      .from("activity_tracker_entries")
      .upsert(
        {
          activity_id,
          date,
          completed: Boolean(completed),
          user_id: userId,
        },
        {
          onConflict: "activity_id,date,user_id",
        },
      )
      .select(ENTRY_SELECT_COLUMNS)
      .single();

    if (upsertError) {
      console.error("Error saving entry:", upsertError);
      return NextResponse.json(
        { error: upsertError.message || "Unable to save entry." },
        { status: 500 },
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error in POST /api/activity-tracker/entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
