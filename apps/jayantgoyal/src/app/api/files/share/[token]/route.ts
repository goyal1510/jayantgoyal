import { NextRequest, NextResponse } from "next/server"

import {
  FILE_SHARE_SIGNED_URL_SECONDS,
  hashShareToken,
} from "@/lib/file-manager/share-links"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

interface RouteContext {
  params: Promise<{ token: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Share link not found." }, { status: 404 })
    }

    const supabase = createSupabaseAdminClient()
    const tokenHash = hashShareToken(token)
    const now = new Date().toISOString()

    const { data: share, error: shareError } = await supabase
      .schema("jg_app")
      .from("file_manager_share_links")
      .select("id,file_id,expires_at,revoked_at,download_count")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", now)
      .maybeSingle()

    if (shareError) {
      console.error("Error loading share link:", shareError)
      return NextResponse.json({ error: "Unable to load share link." }, { status: 500 })
    }

    if (!share) {
      return NextResponse.json({ error: "Share link not found." }, { status: 404 })
    }

    const { data: file, error: fileError } = await supabase
      .schema("jg_app")
      .from("file_manager_files")
      .select("id,file_name,display_name,original_filename,mime_type,size_bytes,storage_path,is_directory,is_deleted")
      .eq("id", share.file_id)
      .eq("is_deleted", false)
      .maybeSingle()

    if (fileError) {
      console.error("Error loading shared file:", fileError)
      return NextResponse.json({ error: "Unable to load shared file." }, { status: 500 })
    }

    if (!file || file.is_directory || !file.storage_path) {
      return NextResponse.json({ error: "Shared file not found." }, { status: 404 })
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("private-files")
      .createSignedUrl(file.storage_path, FILE_SHARE_SIGNED_URL_SECONDS)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Error creating shared signed URL:", signedUrlError)
      return NextResponse.json({ error: "Unable to create download link." }, { status: 500 })
    }

    await supabase
      .schema("jg_app")
      .from("file_manager_share_links")
      .update({
        last_accessed_at: now,
        download_count: (share.download_count ?? 0) + 1,
      })
      .eq("id", share.id)

    if (request.nextUrl.searchParams.get("json") === "1") {
      return NextResponse.json({
        file: {
          name: file.display_name || file.original_filename || file.file_name,
          mimeType: file.mime_type,
          sizeBytes: file.size_bytes,
        },
        signedUrl: signedUrlData.signedUrl,
        expiresInSeconds: FILE_SHARE_SIGNED_URL_SECONDS,
      })
    }

    return NextResponse.redirect(signedUrlData.signedUrl, 302)
  } catch (error) {
    console.error("Error in GET /api/files/share/[token]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
