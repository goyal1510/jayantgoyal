import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const month = url.searchParams.get("month")?.trim() || "2025-01" // Default to January 2025

    // Calculate days in the month
    const year = parseInt(month.split("-")[0])
    const monthNum = parseInt(month.split("-")[1])
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const startDate = `${month}-01`
    const endDate = `${month}-${daysInMonth.toString().padStart(2, "0")}`

    // Get all entries for the month first
    const { data: entries, error: entriesError } = await supabase
      .schema("activity_tracker")
      .from("activity_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)

    if (entriesError) {
      console.error("Error fetching entries:", entriesError)
      return NextResponse.json(
        { error: entriesError.message || "Unable to fetch entries." },
        { status: 500 }
      )
    }

    // Get activities that have entries in this month
    const activityIdsWithEntries = new Set(
      (entries || []).map((e) => e.activity_id).filter(Boolean)
    )

    // Fetch activities based on visibility logic:
    // - Show activities that have entries in this month (regardless of is_active), OR
    // - Show only active activities (for months with no entries yet)
    let activitiesQuery = supabase
      .schema("activity_tracker")
      .from("activities")
      .select("*")
      .eq("user_id", user.id)

    if (activityIdsWithEntries.size > 0) {
      // Fetch all activities, then filter in memory
      const { data: allActivities, error: activitiesError } = await activitiesQuery
        .order("created_at", { ascending: true })

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError)
        return NextResponse.json(
          { error: activitiesError.message || "Unable to fetch activities." },
          { status: 500 }
        )
      }

      // Filter activities: show those with entries OR active ones
      const activities =
        allActivities?.filter(
          (activity) =>
            activityIdsWithEntries.has(activity.id) || activity.is_active === true
        ) || []

      if (activities.length === 0) {
        return NextResponse.json({ stats: [] })
      }

      // Continue with filtered activities
      const stats = activities.map((activity) => {
        const activityEntries = (entries || []).filter(
          (entry) => entry.activity_id === activity.id && entry.completed
        )
        const completedDays = activityEntries.length
        const completionRate =
          daysInMonth > 0 ? (completedDays / daysInMonth) * 100 : 0

        return {
          activity_id: activity.id,
          activity_name: activity.name,
          total_days: daysInMonth,
          completed_days: completedDays,
          completion_rate: Math.round(completionRate * 100) / 100,
        }
      })

      // Calculate overall stats
      const totalActivities = activities.length
      const totalPossibleDays = totalActivities * daysInMonth
      const completedEntries = (entries || []).filter((e) => e.completed)
      const uniqueCompletedDays = new Set(completedEntries.map((e) => e.date)).size
      const totalCompletedEntries = completedEntries.length
      const overallCompletionRate =
        totalPossibleDays > 0
          ? (totalCompletedEntries / totalPossibleDays) * 100
          : 0

      return NextResponse.json({
        stats,
        overall: {
          total_activities: totalActivities,
          total_days: daysInMonth,
          total_completed_days: totalCompletedEntries,
          unique_completed_days: uniqueCompletedDays,
          overall_completion_rate: Math.round(overallCompletionRate * 100) / 100,
        },
      })
    } else {
      // No entries in this month, only show active activities
      const { data: activities, error: activitiesError } = await activitiesQuery
        .eq("is_active", true)
        .order("created_at", { ascending: true })

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError)
        return NextResponse.json(
          { error: activitiesError.message || "Unable to fetch activities." },
          { status: 500 }
        )
      }

      if (!activities || activities.length === 0) {
        return NextResponse.json({ stats: [] })
      }

      // Calculate stats for each activity
      const stats = activities.map((activity) => {
        const activityEntries = (entries || []).filter(
          (entry) => entry.activity_id === activity.id && entry.completed
        )
        const completedDays = activityEntries.length
        const completionRate =
          daysInMonth > 0 ? (completedDays / daysInMonth) * 100 : 0

        return {
          activity_id: activity.id,
          activity_name: activity.name,
          total_days: daysInMonth,
          completed_days: completedDays,
          completion_rate: Math.round(completionRate * 100) / 100,
        }
      })

      // Calculate overall stats
      const totalActivities = activities.length
      const totalPossibleDays = totalActivities * daysInMonth
      const completedEntries = (entries || []).filter((e) => e.completed)
      const uniqueCompletedDays = new Set(completedEntries.map((e) => e.date)).size
      const totalCompletedEntries = completedEntries.length
      const overallCompletionRate =
        totalPossibleDays > 0
          ? (totalCompletedEntries / totalPossibleDays) * 100
          : 0

      return NextResponse.json({
        stats,
        overall: {
          total_activities: totalActivities,
          total_days: daysInMonth,
          total_completed_days: totalCompletedEntries,
          unique_completed_days: uniqueCompletedDays,
          overall_completion_rate: Math.round(overallCompletionRate * 100) / 100,
        },
      })
    }
  } catch (error) {
    console.error("Error in GET /api/activities/stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

