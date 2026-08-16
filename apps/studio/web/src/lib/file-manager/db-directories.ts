import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DirectoryListingItem,
  CreateDirectoryPathParams,
  ListDirectoryParams,
} from "./types";

/**
 * Create a directory path (creates all parent directories if needed)
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param directoryPath - Directory path (e.g., '/documents/personal/adhar')
 * @returns Directory ID (UUID) or null if failed
 */
export async function createDirectoryPath(
  supabase: SupabaseClient,
  userId: string,
  directoryPath: string
): Promise<string | null> {
  const { data, error } = await supabase
    .schema("jg_app")
    .rpc("create_directory_path", {
      p_user_id: userId,
      p_directory_path: directoryPath,
    } as CreateDirectoryPathParams);

  if (error) {
    console.error("Error creating directory path:", error);
    return null;
  }

  return data;
}

/**
 * List contents of a directory
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param directoryPath - Directory path (default: '/')
 * @returns Array of directory items or null if error
 */
export async function listDirectory(
  supabase: SupabaseClient,
  userId: string,
  directoryPath: string = "/"
): Promise<DirectoryListingItem[] | null> {
  const { data, error } = await supabase
    .schema("jg_app")
    .rpc("list_directory", {
      p_user_id: userId,
      p_directory_path: directoryPath,
    } as ListDirectoryParams);

  if (error) {
    console.error("Error listing directory:", error);
    return null;
  }

  return data;
}
