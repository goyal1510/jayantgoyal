import { NextRequest, NextResponse } from "next/server"

import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"
import {
  buildShareUrl,
  createShareToken,
  hashShareToken,
  normalizeExpiryHours,
} from "@/lib/file-manager/share-links"
import { createSupabaseServerClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: fileId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: links, error } = await supabase
      .schema("jg_app")
      .from("file_manager_share_links")
      .select("id,file_id,user_id,expires_at,revoked_at,last_accessed_at,download_count,created_at,updated_at")
      .eq("file_id", fileId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to load share links." },
        { status: 500 }
      )
    }

    return NextResponse.json({ links: links ?? [] })
  } catch (error) {
    console.error("Error in GET /api/files/[id]/share:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: fileId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const access = await getWorkspaceAccessForUser(user.id)
    if (!access.isPro) {
      return NextResponse.json(
        {
          error: "Secure file sharing is included with Pro.",
          code: "FILE_SHARING_PRO_REQUIRED",
          upgradePath: "/pricing",
          plan: access.plan,
        },
        { status: 402 }
      )
    }

    const { data: file, error: fileError } = await supabase
      .schema("jg_app")
      .from("file_manager_files")
      .select("id,user_id,file_name,display_name,is_directory,is_deleted,storage_path")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 })
    }

    if (file.is_directory || !file.storage_path) {
      return NextResponse.json({ error: "Only uploaded files can be shared." }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const expiresInHours = normalizeExpiryHours(body?.expiresInHours)
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    const token = createShareToken()
    const tokenHash = hashShareToken(token)

    const { data: link, error } = await supabase
      .schema("jg_app")
      .from("file_manager_share_links")
      .insert({
        file_id: file.id,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select("id,file_id,user_id,expires_at,revoked_at,last_accessed_at,download_count,created_at,updated_at")
      .single()

    if (error || !link) {
      return NextResponse.json(
        { error: error?.message || "Unable to create share link." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        link,
        shareUrl: buildShareUrl(request.nextUrl.origin, token),
        expiresInHours,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error in POST /api/files/[id]/share:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
