import type { SupabaseClient } from "@supabase/supabase-js";

const FILE_SELECT =
  "id,file_path,file_name,display_name,mime_type,size_bytes,file_type,is_directory,child_count,created_at,updated_at,deleted_at,is_deleted,is_starred";

type SortField = "name" | "date" | "size" | "type";
type SortOrder = "asc" | "desc";

interface ListSpecialFilesOptions {
  userId: string;
  searchQuery?: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
  starredOnly?: boolean;
  limit?: number;
}

export async function listSpecialFiles(
  supabase: SupabaseClient,
  {
    userId,
    searchQuery = "",
    sortField = "date",
    sortOrder = "desc",
    starredOnly = false,
    limit = 100,
  }: ListSpecialFilesOptions
) {
  let query = supabase
    .schema("jg_app")
    .from("file_manager_files")
    .select(FILE_SELECT)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (starredOnly) {
    query = query.eq("is_starred", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  let files = data || [];

  if (normalizedQuery) {
    files = files.filter((file) => {
      const searchable = [
        file.display_name,
        file.file_name,
        file.mime_type,
        file.file_type,
        file.file_path,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }

  return [...files].sort((a, b) => {
    let comparison = 0;

    if (a.is_directory && !b.is_directory) return -1;
    if (!a.is_directory && b.is_directory) return 1;

    switch (sortField) {
      case "name":
        comparison = (a.display_name || a.file_name).localeCompare(
          b.display_name || b.file_name
        );
        break;
      case "date":
        comparison =
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case "size":
        comparison = (a.size_bytes || 0) - (b.size_bytes || 0);
        break;
      case "type":
        comparison = a.file_type.localeCompare(b.file_type);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
}
