import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .schema("jg_app")
      .from("custom_calculator_templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to delete calculator template." },
        { status: 500 }
      )
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("Error in DELETE /api/custom-calculator/templates/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
