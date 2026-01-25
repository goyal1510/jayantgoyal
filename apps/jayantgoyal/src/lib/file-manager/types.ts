// Type definitions for the File Manager application
// These types match the database schema in the fmanager schema

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
// Database Types (matching fmanager.files table)
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
// File Type Category (matching fmanager.file_type_categories table)
// ============================================

export interface FileTypeCategoryRecord {
  type_name: FileTypeCategory;
  display_name: string;
  icon: string | null;
  allowed_mime_types: string[];
  max_size_bytes: number;
  can_preview: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Function Return Types
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

export interface GetDirectoryTreeParams {
  p_user_id: string;
  p_parent_path?: string;
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

export interface MoveFileParams {
  p_file_id: string;
  p_new_directory_path: string;
  p_user_id: string;
}

export interface CopyFileParams {
  p_file_id: string;
  p_target_directory_path: string;
  p_user_id: string;
}

// ============================================
// UI/Application Types
// ============================================

export type FileItemType = "file" | "directory";

export interface FileItem {
  id: string;
  name: string;
  type: FileItemType;
  path: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper type for file upload
export interface FileUploadData {
  file: File;
  directoryPath: string;
  displayName?: string;
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
