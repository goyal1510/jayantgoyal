import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FileRecord,
  GetFileByPathParams,
  GenerateStoragePathParams,
  MoveFileParams,
  CopyFileParams,
  CreateFileData,
} from "./types";

/**
 * Get file by path
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param filePath - Full file path
 * @returns File record or null if not found
 */
export async function getFileByPath(
  supabase: SupabaseClient,
  userId: string,
  filePath: string
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .schema("jg_app")
    .rpc("get_file_by_path", {
      p_user_id: userId,
      p_file_path: filePath,
    } as GetFileByPathParams);

  if (error) {
    console.error("Error getting file by path:", error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Generate storage path for a file
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param filePath - File path
 * @param fileName - File name
 * @returns Storage path string or null if error
 */
export async function generateStoragePath(
  supabase: SupabaseClient,
  userId: string,
  filePath: string,
  fileName: string
): Promise<string | null> {
  const { data, error } = await supabase
    .schema("jg_app")
    .rpc("generate_storage_path", {
      p_user_id: userId,
      p_file_path: filePath,
      p_file_name: fileName,
    } as GenerateStoragePathParams);

  if (error) {
    console.error("Error generating storage path:", error);
    return null;
  }

  return data;
}

/**
 * Create a file record in the database
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param fileData - File data
 * @returns Created file record or null if error
 */
export async function createFileRecord(
  supabase: SupabaseClient,
  userId: string,
  fileData: CreateFileData
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .schema("jg_app")
    .from("file_manager_files")
    .insert({
      ...fileData,
      user_id: userId,
      bucket_id: fileData.bucket_id || "private-files",
      is_directory: false,
      version: 1,
      is_latest_version: true,
      is_deleted: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating file record:", error);
    return null;
  }

  return data;
}

/**
 * Move a file to a new directory
 * @param supabase - Supabase client instance
 * @param fileId - File ID
 * @param newDirectoryPath - New directory path
 * @param userId - User ID
 * @returns true if successful, false otherwise
 */
export async function moveFile(
  supabase: SupabaseClient,
  fileId: string,
  newDirectoryPath: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .schema("jg_app")
    .rpc("move_file", {
      p_file_id: fileId,
      p_new_directory_path: newDirectoryPath,
      p_user_id: userId,
    } as MoveFileParams);

  if (error) {
    console.error("Error moving file:", error);
    return false;
  }

  return data === true;
}

/**
 * Copy a file to a new directory
 * @param supabase - Supabase client instance
 * @param fileId - File ID
 * @param targetDirectoryPath - Target directory path
 * @param userId - User ID
 * @returns New file ID or null if failed
 */
export async function copyFile(
  supabase: SupabaseClient,
  fileId: string,
  targetDirectoryPath: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .schema("jg_app")
    .rpc("copy_file", {
      p_file_id: fileId,
      p_target_directory_path: targetDirectoryPath,
      p_user_id: userId,
    } as CopyFileParams);

  if (error) {
    console.error("Error copying file:", error);
    return null;
  }

  return data;
}

/**
 * Soft delete a file (mark as deleted)
 * Uses RPC function to bypass RLS issues with UPDATE policy
 * @param supabase - Supabase client instance
 * @param fileId - File ID
 * @param userId - User ID
 * @returns true if successful, false otherwise
 */
export async function deleteFile(
  supabase: SupabaseClient,
  fileId: string,
  userId: string
): Promise<boolean> {
  // Try using RPC function first (if it exists)
  const { data: rpcData, error: rpcError } = await supabase
    .schema("jg_app")
    .rpc("soft_delete_file", {
      p_file_id: fileId,
      p_user_id: userId,
    });

  if (!rpcError && rpcData === true) {
    return true;
  }

  // Fallback to direct UPDATE (will work after RLS policy is fixed)
  const { data, error } = await supabase
    .schema("jg_app")
    .from("file_manager_files")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error deleting file:", error);
    return false;
  }

  return data !== null;
}

/**
 * Restore a soft-deleted file
 * @param supabase - Supabase client instance
 * @param fileId - File ID
 * @param userId - User ID
 * @returns true if successful, false otherwise
 */
export async function restoreFile(
  supabase: SupabaseClient,
  fileId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .schema("jg_app")
    .from("file_manager_files")
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error restoring file:", error);
    return false;
  }

  return data !== null;
}

/**
 * Update file metadata (rename, display name, etc.)
 * @param supabase - Supabase client instance
 * @param fileId - File ID
 * @param userId - User ID
 * @param updates - Partial file record with fields to update
 * @returns Updated file record or null if error
 */
export async function updateFileMetadata(
  supabase: SupabaseClient,
  fileId: string,
  userId: string,
  updates: Partial<Pick<FileRecord, "display_name" | "file_name" | "file_path">>
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .schema("jg_app")
    .from("file_manager_files")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating file metadata:", error);
    return null;
  }

  return data;
}

/**
 * Get all file type categories
 * @param supabase - Supabase client instance
 * @returns Array of file type categories or null if error
 */
export async function getFileTypeCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .schema("jg_app")
    .from("file_manager_type_categories")
    .select("*")
    .order("display_name");

  if (error) {
    console.error("Error getting file type categories:", error);
    return null;
  }

  return data;
}
