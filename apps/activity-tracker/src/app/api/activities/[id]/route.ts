import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: activityId } = await params

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { is_active, name } = body ?? {}

    const updateData: { is_active?: boolean; name?: string } = {}

    if (typeof is_active === "boolean") {
      updateData.is_active = is_active
    }

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field (name or is_active) is required." },
        { status: 400 }
      )
    }

    // Verify the activity belongs to the user
    const { data: activity, error: fetchError } = await supabase
      .schema("activity_tracker")
      .from("activities")
      .select("id")
      .eq("id", activityId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !activity) {
      return NextResponse.json(
        { error: "Activity not found or unauthorized." },
        { status: 404 }
      )
    }

    // Update activity fields
    const { data: updatedActivity, error: updateError } = await supabase
      .schema("activity_tracker")
      .from("activities")
      .update(updateData)
      .eq("id", activityId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating activity:", updateError)
      return NextResponse.json(
        { error: updateError.message || "Unable to update activity." },
        { status: 500 }
      )
    }

    return NextResponse.json({ activity: updatedActivity })
  } catch (error) {
    console.error("Error in PATCH /api/activities/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

