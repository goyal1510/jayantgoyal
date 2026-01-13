// Type definitions will be added here as we develop the application
// This file will include types for files, directories, and other entities

export type FileType = "file" | "directory";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  path: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}
