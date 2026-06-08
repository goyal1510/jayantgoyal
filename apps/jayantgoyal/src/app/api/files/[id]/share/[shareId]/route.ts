import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string; shareId: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id: fileId, shareId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .schema("jg_app")
      .from("file_manager_share_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", shareId)
      .eq("file_id", fileId)
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to revoke share link." },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Share link not found." }, { status: 404 })
    }

    return NextResponse.json({ revoked: true })
  } catch (error) {
    console.error("Error in DELETE /api/files/[id]/share/[shareId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
