import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateFileMetadata, getFileByPath } from "@/lib/file-manager/database";

export async function handlePatchFile(
  request: NextRequest,
  fileId: string,
  supabase: SupabaseClient,
  userId: string,
) {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // eslint-disable-next-line no-control-regex
  const sanitizedName = name.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
  if (!sanitizedName) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const currentFile = await supabase
    .schema("studio")
    .from("file_entries")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  if (currentFile.error || !currentFile.data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const file = currentFile.data;

  if (file.is_deleted) {
    return NextResponse.json(
      { error: "Cannot rename deleted file" },
      { status: 400 },
    );
  }

  if (file.is_directory) {
    return handleRenameDirectory(supabase, fileId, userId, file, sanitizedName);
  } else {
    return handleRenameFile(supabase, fileId, userId, file, sanitizedName);
  }
}

async function handleRenameDirectory(
  supabase: SupabaseClient,
  fileId: string,
  userId: string,
  file: Record<string, unknown>,
  sanitizedName: string,
) {
  const fileName = file.file_name as string;
  const filePath = file.file_path as string;
  const parentPath = filePath.substring(0, filePath.lastIndexOf(fileName));
  const newPath = parentPath + sanitizedName + "/";

  const existingFile = await getFileByPath(supabase, userId, newPath);
  if (existingFile && existingFile.id !== fileId) {
    return NextResponse.json(
      { error: "A folder with this name already exists" },
      { status: 409 },
    );
  }

  const updated = await updateFileMetadata(supabase, fileId, userId, {
    file_name: sanitizedName,
    file_path: newPath,
    display_name: sanitizedName,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to rename folder" },
      { status: 500 },
    );
  }

  const oldPathPrefix = filePath;
  const { data: children, error: childrenError } = await supabase
    .schema("studio")
    .from("file_entries")
    .select("id, file_path")
    .eq("user_id", userId)
    .like("file_path", `${oldPathPrefix}%`)
    .neq("id", fileId)
    .eq("is_deleted", false);

  if (childrenError) {
    console.error("Error fetching children:", childrenError);
  } else if (children && children.length > 0) {
    for (const child of children) {
      const newChildPath = child.file_path.replace(oldPathPrefix, newPath);
      await supabase
        .schema("studio")
        .from("file_entries")
        .update({
          file_path: newChildPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", child.id)
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({
    success: true,
    file: updated,
  });
}

async function handleRenameFile(
  supabase: SupabaseClient,
  fileId: string,
  userId: string,
  file: Record<string, unknown>,
  sanitizedName: string,
) {
  const fileName = file.file_name as string;
  const filePath = file.file_path as string;
  const parentPath = filePath.substring(0, filePath.lastIndexOf(fileName));
  const fileExtension = fileName.includes(".")
    ? fileName.substring(fileName.lastIndexOf("."))
    : "";
  const newFileName = sanitizedName + fileExtension;
  const newPath = parentPath + newFileName;

  const existingFile = await getFileByPath(supabase, userId, newPath);
  if (existingFile && existingFile.id !== fileId) {
    return NextResponse.json(
      { error: "A file with this name already exists" },
      { status: 409 },
    );
  }

  const updated = await updateFileMetadata(supabase, fileId, userId, {
    file_name: newFileName,
    file_path: newPath,
    display_name: sanitizedName,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to rename file" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    file: updated,
  });
}
