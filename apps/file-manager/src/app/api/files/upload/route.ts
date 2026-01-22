import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDirectoryPath, getFileByPath, createFileRecord, generateStoragePath } from "@/lib/db/files";
import type { FileTypeCategory, CreateFileData } from "@/lib/types";

// Maximum file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Allowed MIME types mapped to file type categories
const MIME_TYPE_MAP: Record<string, FileTypeCategory> = {
  // Images
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/svg+xml": "image",
  // PDF
  "application/pdf": "pdf",
  // Documents
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.oasis.opendocument.text": "document",
  "text/plain": "document",
  // Spreadsheets
  "application/vnd.ms-excel": "spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "spreadsheet",
  "application/vnd.oasis.opendocument.spreadsheet": "spreadsheet",
  // Presentations
  "application/vnd.ms-powerpoint": "presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "presentation",
  "application/vnd.oasis.opendocument.presentation": "presentation",
  // Videos
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  // Audio
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  // Archives
  "application/zip": "archive",
  "application/x-rar-compressed": "archive",
  "application/x-tar": "archive",
  "application/gzip": "archive",
  // Code
  "text/x-python": "code",
  "application/javascript": "code",
  "text/javascript": "code",
  "text/html": "code",
  "text/css": "code",
  "application/json": "code",
  "text/x-java-source": "code",
};

/**
 * Get file type category from MIME type
 */
function getFileTypeFromMime(mimeType: string): FileTypeCategory {
  return MIME_TYPE_MAP[mimeType] || "other";
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFileName(fileName: string): string {
  return fileName.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
}

/**
 * Generate a unique filename by adding a number suffix
 * e.g., "file.jpg" -> "file (1).jpg", "file (1).jpg" -> "file (2).jpg"
 */
async function generateUniqueFileName(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  directoryPath: string,
  originalFileName: string
): Promise<string> {
  const lastDotIndex = originalFileName.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0;
  const baseName = hasExtension ? originalFileName.slice(0, lastDotIndex) : originalFileName;
  const extension = hasExtension ? originalFileName.slice(lastDotIndex) : "";

  let counter = 1;
  let newFileName = `${baseName} (${counter})${extension}`;
  let newFilePath = directoryPath + newFileName;

  // Keep incrementing until we find a unique name
  while (await getFileByPath(supabase, userId, newFilePath)) {
    counter++;
    newFileName = `${baseName} (${counter})${extension}`;
    newFilePath = directoryPath + newFileName;
  }

  return newFileName;
}

/**
 * POST /api/files/upload
 * Upload a file to Supabase Storage and create metadata record
 *
 * Form data:
 * - file: File to upload
 * - directoryPath: Directory path to upload to (default: "/")
 * - displayName: Optional display name for the file
 * - overwrite: "true" to replace existing file
 * - rename: "true" to auto-rename if file exists (adds number suffix)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const directoryPath = (formData.get("directoryPath") as string) || "/";
    const displayName = formData.get("displayName") as string | null;
    const overwrite = formData.get("overwrite") === "true";
    const rename = formData.get("rename") === "true";

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file name
    let sanitizedFileName = sanitizeFileName(file.name);
    if (!sanitizedFileName) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 }
      );
    }

    // Normalize directory path
    const normalizedDirPath = directoryPath === "/"
      ? "/"
      : directoryPath.endsWith("/")
        ? directoryPath
        : directoryPath + "/";

    // Construct full file path
    let filePath = normalizedDirPath + sanitizedFileName;

    // Check if file already exists at this path
    const existingFile = await getFileByPath(supabase, user.id, filePath);
    if (existingFile) {
      if (overwrite) {
        // Delete the existing file from storage and database
        if (existingFile.storage_path) {
          await supabase.storage.from("private-files").remove([existingFile.storage_path]);
        }
        // Soft delete the existing record
        await supabase
          .schema("fmanager")
          .from("files")
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq("id", existingFile.id)
          .eq("user_id", user.id);
      } else if (rename) {
        // Generate a unique filename with number suffix
        sanitizedFileName = await generateUniqueFileName(supabase, user.id, normalizedDirPath, sanitizedFileName);
        filePath = normalizedDirPath + sanitizedFileName;
      } else {
        // Return conflict error - let client handle resolution
        return NextResponse.json(
          {
            error: "A file with this name already exists in this directory",
            code: "FILE_EXISTS",
            existingFile: {
              id: existingFile.id,
              name: existingFile.file_name,
              size: existingFile.size_bytes,
              updated_at: existingFile.updated_at,
            }
          },
          { status: 409 }
        );
      }
    }

    // Ensure parent directory exists (creates all parent directories if needed)
    let parentId: string | null = null;
    if (normalizedDirPath !== "/") {
      parentId = await createDirectoryPath(supabase, user.id, normalizedDirPath);
      if (!parentId) {
        return NextResponse.json(
          { error: "Failed to create parent directory" },
          { status: 500 }
        );
      }
    } else {
      // For root directory, get the root directory ID
      const rootDir = await getFileByPath(supabase, user.id, "/");
      parentId = rootDir?.id || null;

      // Create root directory if it doesn't exist
      if (!parentId) {
        parentId = await createDirectoryPath(supabase, user.id, "/");
      }
    }

    // Generate storage path
    const storagePath = await generateStoragePath(supabase, user.id, filePath, sanitizedFileName);
    if (!storagePath) {
      return NextResponse.json(
        { error: "Failed to generate storage path" },
        { status: 500 }
      );
    }

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("private-files")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get file type category from MIME type
    const fileType = getFileTypeFromMime(file.type);

    // Create file metadata record
    const fileData: CreateFileData = {
      original_filename: file.name,
      display_name: displayName || undefined,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      file_path: filePath,
      file_name: sanitizedFileName,
      file_type: fileType,
      parent_id: parentId,
      storage_path: storagePath,
      bucket_id: "private-files",
    };

    const fileRecord = await createFileRecord(supabase, user.id, fileData);

    if (!fileRecord) {
      // Rollback: delete the uploaded file from storage
      await supabase.storage.from("private-files").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        path: fileRecord.file_path,
        name: fileRecord.file_name,
        display_name: fileRecord.display_name,
        size_bytes: fileRecord.size_bytes,
        mime_type: fileRecord.mime_type,
        file_type: fileRecord.file_type,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
