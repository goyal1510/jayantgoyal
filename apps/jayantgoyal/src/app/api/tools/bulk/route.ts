import { NextRequest, NextResponse } from "next/server"

import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  canPersistToolHistory,
  isAllowedBulkToolPayload,
  normalizeSavedToolId,
} from "@/lib/tools/persistence"

interface BulkResult {
  index: number
  input: string
  ok: boolean
  output: string
  error?: string
}

function formatJson(toolId: string, input: string) {
  const parsed = JSON.parse(input)
  if (toolId === "json-minify") {
    return JSON.stringify(parsed)
  }
  return JSON.stringify(parsed, null, 2)
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
    const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : []
    const items = rawItems.filter((item): item is string => typeof item === "string" && item.trim().length > 0)

    if (!toolId || !canPersistToolHistory(toolId)) {
      return NextResponse.json(
        {
          error: "Bulk processing is disabled for sensitive or unsupported tools.",
          code: "TOOL_BULK_NOT_ALLOWED",
        },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "Add at least one JSON item to process." }, { status: 400 })
    }

    const access = await getWorkspaceAccessForUser(user.id)
    if (items.length > access.limits.toolBulkItems) {
      return NextResponse.json(
        {
          error: access.isPro
            ? `Pro bulk tools can process ${access.limits.toolBulkItems} items at a time.`
            : `Free workspaces can bulk process ${access.limits.toolBulkItems} items at a time. Upgrade for larger batches.`,
          code: "TOOL_BULK_LIMIT_REACHED",
          upgradePath: "/pricing",
          plan: access.plan,
          limit: access.limits.toolBulkItems,
        },
        { status: 402 }
      )
    }

    const tooLarge = items.some((item) => !isAllowedBulkToolPayload({ text: item }))
    if (tooLarge) {
      return NextResponse.json({ error: "One or more bulk items are too large." }, { status: 413 })
    }

    const results: BulkResult[] = items.map((item, index) => {
      try {
        return {
          index,
          input: item,
          ok: true,
          output: formatJson(toolId, item),
        }
      } catch (error) {
        return {
          index,
          input: item,
          ok: false,
          output: "",
          error: error instanceof Error ? error.message : "Invalid JSON",
        }
      }
    })

    return NextResponse.json({
      results,
      access: {
        plan: access.plan,
        isPro: access.isPro,
        limit: access.limits.toolBulkItems,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/tools/bulk:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
