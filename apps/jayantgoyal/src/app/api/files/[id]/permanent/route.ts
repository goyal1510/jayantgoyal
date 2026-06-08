import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DeletedFileRecord = {
  id: string;
  storage_path: string | null;
  file_path: string;
  is_directory: boolean;
};

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    const admin = createSupabaseAdminClient();

    const { data: file, error: fileError } = await admin
      .schema("jg_app")
      .from("file_manager_files")
      .select("id,storage_path,file_path,is_directory")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .eq("is_deleted", true)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "Deleted file not found" },
        { status: 404 }
      );
    }

    const rowsToDelete: DeletedFileRecord[] = [file];

    if (file.is_directory) {
      const { data: descendants, error: descendantError } = await admin
        .schema("jg_app")
        .from("file_manager_files")
        .select("id,storage_path,file_path,is_directory")
        .eq("user_id", user.id)
        .eq("is_deleted", true)
        .like("file_path", `${file.file_path}%`)
        .neq("id", file.id);

      if (descendantError) {
        console.error("Error loading deleted descendants:", descendantError);
        return NextResponse.json(
          { error: "Failed to inspect folder contents" },
          { status: 500 }
        );
      }

      rowsToDelete.push(...(descendants || []));
    }

    const storagePaths = rowsToDelete
      .filter((row) => !row.is_directory && row.storage_path)
      .map((row) => row.storage_path as string);

    if (storagePaths.length > 0) {
      const { error: storageError } = await admin.storage
        .from("private-files")
        .remove(storagePaths);

      if (storageError) {
        console.error("Error deleting storage objects:", storageError);
        return NextResponse.json(
          { error: "Failed to delete stored file objects" },
          { status: 500 }
        );
      }
    }

    const idsToDelete = rowsToDelete.map((row) => row.id);
    const { error: deleteError } = await admin
      .schema("jg_app")
      .from("file_manager_files")
      .delete()
      .eq("user_id", user.id)
      .in("id", idsToDelete);

    if (deleteError) {
      console.error("Error permanently deleting file:", deleteError);
      return NextResponse.json(
        { error: "Failed to permanently delete item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      message: "Item permanently deleted",
    });
  } catch (error) {
    console.error("Error permanently deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
