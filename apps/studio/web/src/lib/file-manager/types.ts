// Type definitions for the File Manager application
// These types match the database schema in the jg_app schema

// ============================================
// File Type Categories
// ============================================

export type FileTypeCategory =
  | "image"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "video"
  | "audio"
  | "archive"
  | "code"
  | "other"
  | "directory";

// ============================================
// Database Types (matching jg_app.file_manager_files table)
// ============================================

export interface FileRecord {
  id: string; // UUID
  bucket_id: string;
  storage_path: string;
  original_filename: string;
  display_name: string | null;
  mime_type: string;
  size_bytes: number;
  file_path: string;
  file_name: string;
  is_directory: boolean;
  child_count: number;
  file_type: FileTypeCategory;
  user_id: string; // UUID
  parent_id: string | null; // UUID
  version: number;
  is_latest_version: boolean;
  file_hash: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  deleted_at: string | null; // ISO timestamp
  is_deleted: boolean;
}

// ============================================
// File Type Category (matching jg_app.file_manager_type_categories table)
// ============================================

export interface DirectoryTreeItem {
  id: string;
  file_path: string;
  file_name: string;
  display_name: string | null;
  mime_type: string;
  size_bytes: number;
  file_type: FileTypeCategory;
  is_directory: boolean;
  child_count: number;
  created_at: string;
  updated_at: string;
  depth: number;
}

export interface DirectoryListingItem {
  id: string;
  file_path: string;
  file_name: string;
  display_name: string | null;
  mime_type: string;
  size_bytes: number;
  file_type: FileTypeCategory;
  is_directory: boolean;
  child_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Function Parameters
// ============================================

export interface CreateDirectoryPathParams {
  p_user_id: string;
  p_directory_path: string;
}

export interface ListDirectoryParams {
  p_user_id: string;
  p_directory_path?: string;
}

export interface GetFileByPathParams {
  p_user_id: string;
  p_file_path: string;
}

export interface GenerateStoragePathParams {
  p_user_id: string;
  p_file_path: string;
  p_file_name: string;
}

// Helper type for file creation
export interface CreateFileData {
  original_filename: string;
  display_name?: string;
  mime_type: string;
  size_bytes: number;
  file_path: string;
  file_name: string;
  file_type: FileTypeCategory;
  parent_id: string | null;
  storage_path: string;
  bucket_id?: string;
}
