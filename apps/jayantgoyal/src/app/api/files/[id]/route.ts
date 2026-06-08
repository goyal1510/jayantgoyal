import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteFile } from "@/lib/file-manager/database";
import { handlePatchFile } from "./handlers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: fileId } = await params;

    const { data: file, error: fileError } = await supabase
      .schema("jg_app")
      .from("file_manager_files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (file.is_directory) {
      return NextResponse.json({
        success: true,
        file: {
          id: file.id,
          name: file.file_name,
          display_name: file.display_name,
          path: file.file_path,
          is_directory: true,
          child_count: file.child_count,
          created_at: file.created_at,
          updated_at: file.updated_at,
        },
      });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("private-files")
      .createSignedUrl(file.storage_path, 60);

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate file URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.file_name,
        display_name: file.display_name,
        original_filename: file.original_filename,
        path: file.file_path,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        file_type: file.file_type,
        is_directory: false,
        version: file.version,
        is_latest_version: file.is_latest_version,
        file_hash: file.file_hash,
        is_starred: file.is_starred,
        created_at: file.created_at,
        updated_at: file.updated_at,
        url: signedUrlData.signedUrl,
      },
    });
  } catch (error) {
    console.error("Error getting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: fileId } = await params;

    return handlePatchFile(request, fileId, supabase, user.id);
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: fileId } = await params;

    const file = await supabase
      .schema("jg_app")
      .from("file_manager_files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (file.error || !file.data) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (file.data.is_deleted) {
      return NextResponse.json(
        { error: "File is already deleted" },
        { status: 400 }
      );
    }

    const success = await deleteFile(supabase, fileId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
