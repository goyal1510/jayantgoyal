import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { normalizeSavedToolCollection, normalizeSavedToolTitle } from "@/lib/tools/persistence"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Invalid saved item id." }, { status: 400 })
    }

    const body = await request.json()
    const title = body?.title === undefined ? undefined : normalizeSavedToolTitle(body.title)
    const isFavorite = typeof body?.isFavorite === "boolean" ? body.isFavorite : undefined
    const collection = body?.collection === undefined
      ? undefined
      : normalizeSavedToolCollection(body.collection)

    if (title === "" || (title === undefined && isFavorite === undefined && collection === undefined)) {
      return NextResponse.json({ error: "No valid saved item updates were provided." }, { status: 400 })
    }

    const { data: existing, error: loadError } = await supabase
      .schema("jg_app")
      .from("tool_saved_items")
      .select("id,metadata")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (loadError || !existing) {
      const status = loadError?.code === "PGRST116" ? 404 : 500
      return NextResponse.json(
        { error: status === 404 ? "Saved item not found." : loadError?.message || "Unable to load saved item." },
        { status }
      )
    }

    const metadata = existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? { ...existing.metadata }
      : {}

    if (isFavorite !== undefined) {
      metadata.isFavorite = isFavorite
    }
    if (collection !== undefined) {
      if (collection) {
        metadata.collection = collection
      } else {
        delete metadata.collection
      }
    }

    const updatePayload: { title?: string; metadata: Record<string, unknown> } = { metadata }
    if (title !== undefined) {
      updatePayload.title = title
    }

    const { data, error } = await supabase
      .schema("jg_app")
      .from("tool_saved_items")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id,tool_id,title,input_payload,output_payload,metadata,created_at,updated_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to update saved tool item." }, { status: 500 })
    }

    return NextResponse.json({ savedItem: data })
  } catch (error) {
    console.error("Error in PATCH /api/tools/saved/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Invalid saved item id." }, { status: 400 })
    }

    const { error } = await supabase
      .schema("jg_app")
      .from("tool_saved_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to delete saved tool item." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error in DELETE /api/tools/saved/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
