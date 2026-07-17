import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { allTools } from "@/lib/tools/tools"

const validToolIds = new Set(allTools.map((tool) => tool.id))

function isValidToolId(toolId: unknown): toolId is string {
  return typeof toolId === "string" && validToolIds.has(toolId)
}

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return true

  return origin === new URL(request.url).origin
}

async function getAuthedClient() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthedClient()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        favoriteToolIds: [],
        history: [],
      })
    }

    const [{ data: favorites, error: favoritesError }, { data: history, error: historyError }] =
      await Promise.all([
        supabase
          .schema("jg_app")
          .from("tool_favorites")
          .select("tool_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .schema("jg_app")
          .from("tool_history")
          .select("tool_id, visited_at, visit_count")
          .eq("user_id", user.id)
          .order("visited_at", { ascending: false })
          .limit(20),
      ])

    if (favoritesError || historyError) {
      console.error("Error fetching tools usage:", favoritesError ?? historyError)
      return NextResponse.json(
        { error: "Unable to fetch tools usage." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      favoriteToolIds:
        favorites
          ?.map((favorite) => favorite.tool_id)
          .filter((toolId): toolId is string => validToolIds.has(toolId)) ?? [],
      history:
        history
          ?.filter((entry) => validToolIds.has(entry.tool_id))
          .map((entry) => ({
            toolId: entry.tool_id,
            visitedAt: entry.visited_at,
            visitCount: entry.visit_count,
          })) ?? [],
    })
  } catch (error) {
    console.error("Error in GET /api/tools/usage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { supabase, user } = await getAuthedClient()

    if (!user) {
      return NextResponse.json({ ok: false, authenticated: false })
    }

    const body = (await request.json()) as { action?: unknown; toolId?: unknown }
    const action = body.action
    const toolId = body.toolId

    if (!isValidToolId(toolId)) {
      return NextResponse.json({ error: "Invalid tool id." }, { status: 400 })
    }

    if (action === "record-history") {
      const { data: existingHistory } = await supabase
        .schema("jg_app")
        .from("tool_history")
        .select("visit_count")
        .eq("user_id", user.id)
        .eq("tool_id", toolId)
        .maybeSingle()

      const { error } = await supabase
        .schema("jg_app")
        .from("tool_history")
        .upsert(
          {
            user_id: user.id,
            tool_id: toolId,
            visited_at: new Date().toISOString(),
            visit_count:
              typeof existingHistory?.visit_count === "number"
                ? existingHistory.visit_count + 1
                : 1,
          },
          {
            onConflict: "user_id,tool_id",
          }
        )

      if (error) {
        console.error("Error recording tool history:", error)
        return NextResponse.json(
          { error: "Unable to record tool history." },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true })
    }

    if (action === "add-favorite") {
      const { error } = await supabase
        .schema("jg_app")
        .from("tool_favorites")
        .upsert(
          {
            user_id: user.id,
            tool_id: toolId,
          },
          {
            onConflict: "user_id,tool_id",
            ignoreDuplicates: true,
          }
        )

      if (error) {
        console.error("Error adding tool favorite:", error)
        return NextResponse.json(
          { error: "Unable to add favorite." },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true })
    }

    if (action === "remove-favorite") {
      const { error } = await supabase
        .schema("jg_app")
        .from("tool_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("tool_id", toolId)

      if (error) {
        console.error("Error removing tool favorite:", error)
        return NextResponse.json(
          { error: "Unable to remove favorite." },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true })
    }

    if (action === "remove-history") {
      const { error } = await supabase
        .schema("jg_app")
        .from("tool_history")
        .delete()
        .eq("user_id", user.id)
        .eq("tool_id", toolId)

      if (error) {
        console.error("Error removing tool history:", error)
        return NextResponse.json(
          { error: "Unable to remove history item." },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 })
  } catch (error) {
    console.error("Error in POST /api/tools/usage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { supabase, user } = await getAuthedClient()

    if (!user) {
      return NextResponse.json({ ok: false, authenticated: false })
    }

    const { error } = await supabase
      .schema("jg_app")
      .from("tool_history")
      .delete()
      .eq("user_id", user.id)

    if (error) {
      console.error("Error clearing tool history:", error)
      return NextResponse.json(
        { error: "Unable to clear history." },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error in DELETE /api/tools/usage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
