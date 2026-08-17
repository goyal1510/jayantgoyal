import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FileRecord,
  GetFileByPathParams,
  GenerateStoragePathParams,
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
  filePath: string,
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .schema("studio")
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
 * @param fileName - File name
 * @returns Storage path string or null if error
 */
export async function generateStoragePath(
  supabase: SupabaseClient,
  userId: string,
  fileName: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .schema("studio")
    .rpc("generate_storage_path", {
      p_user_id: userId,
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
  fileData: CreateFileData,
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .schema("studio")
    .from("file_entries")
    .insert({
      ...fileData,
      user_id: userId,
      bucket_id: fileData.bucket_id || "studio-files",
      is_directory: false,
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
  userId: string,
): Promise<boolean> {
  // Try using RPC function first (if it exists)
  const { data: rpcData, error: rpcError } = await supabase
    .schema("studio")
    .rpc("soft_delete_file", {
      p_file_id: fileId,
      p_user_id: userId,
    });

  if (!rpcError && rpcData === true) {
    return true;
  }

  // Fallback to direct UPDATE (will work after RLS policy is fixed)
  const { data, error } = await supabase
    .schema("studio")
    .from("file_entries")
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
  updates: Partial<
    Pick<FileRecord, "display_name" | "file_name" | "file_path">
  >,
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .schema("studio")
    .from("file_entries")
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
