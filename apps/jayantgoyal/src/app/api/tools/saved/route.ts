import { NextRequest, NextResponse } from "next/server"

import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  canPersistToolHistory,
  isAllowedSavedToolPayload,
  normalizeSavedToolId,
  normalizeSavedToolTitle,
  SAFE_SAVED_TOOL_ID_LIST,
} from "@/lib/tools/persistence"

function accessResponse(access: Awaited<ReturnType<typeof getWorkspaceAccessForUser>>) {
  return {
    plan: access.plan,
    isPro: access.isPro,
    limit: access.limits.toolSavedItems,
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const toolId = normalizeSavedToolId(request.nextUrl.searchParams.get("toolId"))
    if (toolId && !canPersistToolHistory(toolId)) {
      return NextResponse.json({ error: "Saved history is not enabled for this tool." }, { status: 400 })
    }

    const access = await getWorkspaceAccessForUser(user.id)
    let query = supabase
      .schema("jg_app")
      .from("tool_saved_items")
      .select("id,tool_id,title,input_payload,output_payload,metadata,created_at,updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    query = toolId
      ? query.eq("tool_id", toolId)
      : query.in("tool_id", [...SAFE_SAVED_TOOL_ID_LIST])

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to load saved tool history." }, { status: 500 })
    }

    return NextResponse.json({
      savedItems: data ?? [],
      access: accessResponse(access),
    })
  } catch (error) {
    console.error("Error in GET /api/tools/saved:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const toolId = normalizeSavedToolId(body?.toolId)
    const title = normalizeSavedToolTitle(body?.title)
    const inputPayload = body?.inputPayload ?? null
    const outputPayload = body?.outputPayload ?? null
    const metadata = body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {}

    if (!toolId || !canPersistToolHistory(toolId)) {
      return NextResponse.json(
        {
          error: "Saved history is disabled for sensitive or unsupported tools.",
          code: "TOOL_HISTORY_NOT_ALLOWED",
        },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json({ error: "A title is required before saving." }, { status: 400 })
    }

    if (outputPayload === null) {
      return NextResponse.json({ error: "Output is required before saving." }, { status: 400 })
    }

    if (
      !isAllowedSavedToolPayload(inputPayload) ||
      !isAllowedSavedToolPayload(outputPayload) ||
      !isAllowedSavedToolPayload(metadata)
    ) {
      return NextResponse.json({ error: "Saved tool payload is too large." }, { status: 413 })
    }

    const access = await getWorkspaceAccessForUser(user.id)
    const { count, error: countError } = await supabase
      .schema("jg_app")
      .from("tool_saved_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      return NextResponse.json({ error: countError.message || "Unable to check saved history usage." }, { status: 500 })
    }

    if ((count ?? access.limits.toolSavedItems) >= access.limits.toolSavedItems) {
      return NextResponse.json(
        {
          error: access.isPro
            ? `Pro includes ${access.limits.toolSavedItems} saved tool items.`
            : `Free workspaces include ${access.limits.toolSavedItems} saved tool items. Upgrade for more history.`,
          code: "TOOL_SAVED_ITEMS_LIMIT_REACHED",
          upgradePath: "/pricing",
          plan: access.plan,
          limit: access.limits.toolSavedItems,
        },
        { status: 402 }
      )
    }

    const { data, error } = await supabase
      .schema("jg_app")
      .from("tool_saved_items")
      .insert({
        user_id: user.id,
        tool_id: toolId,
        title,
        input_payload: inputPayload,
        output_payload: outputPayload,
        metadata,
      })
      .select("id,tool_id,title,input_payload,output_payload,metadata,created_at,updated_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to save tool history." }, { status: 500 })
    }

    return NextResponse.json({ savedItem: data, access: accessResponse(access) }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/tools/saved:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
