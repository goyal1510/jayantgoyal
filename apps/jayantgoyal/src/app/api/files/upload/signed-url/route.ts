import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFileByPath, generateStoragePath, createDirectoryPath } from "@/lib/file-manager/database";
import type { FileTypeCategory } from "@/lib/file-manager/types";
import { getFileStorageGate } from "@/lib/commerce/file-gates.server";

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
 * Sanitize filename to remove invalid characters
 */
function sanitizeFileName(fileName: string): string {
  // eslint-disable-next-line no-control-regex
  return fileName.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
}

/**
 * Generate a unique filename by adding a number suffix
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

  while (await getFileByPath(supabase, userId, newFilePath)) {
    counter++;
    newFileName = `${baseName} (${counter})${extension}`;
    newFilePath = directoryPath + newFileName;
  }

  return newFileName;
}

/**
 * POST /api/files/upload/signed-url
 * Generate a signed URL for direct upload to Supabase Storage
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

    // Parse JSON body (small payload, no file data)
    const body = await request.json();
    const {
      fileName,
      fileSize,
      mimeType,
      directoryPath = "/",
      overwrite = false,
      rename = false,
    } = body;

    // Validate required fields
    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    if (!fileSize || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "File size is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Sanitize file name
    let sanitizedFileName = sanitizeFileName(fileName);
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
        // Delete the existing file from storage
        if (existingFile.storage_path) {
          await supabase.storage.from("private-files").remove([existingFile.storage_path]);
        }
        // Hard delete the existing record
        const { error: deleteError } = await supabase
          .schema("jg_app")
          .from("file_manager_files")
          .delete()
          .eq("id", existingFile.id)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Error deleting existing file:", deleteError);
          return NextResponse.json(
            { error: "Failed to replace existing file: " + deleteError.message },
            { status: 500 }
          );
        }
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

    const storageGate = await getFileStorageGate({
      userId: user.id,
      incomingBytes: fileSize,
      replacingBytes: overwrite && existingFile && !existingFile.is_directory
        ? existingFile.size_bytes ?? 0
        : 0,
    });

    if (!storageGate.allowed) {
      return NextResponse.json(
        {
          error: "Storage limit reached. Upgrade to Pro for more file storage.",
          code: "FILE_STORAGE_LIMIT_REACHED",
          gate: storageGate,
        },
        { status: 402 }
      );
    }

    // Ensure parent directory exists
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
      const rootDir = await getFileByPath(supabase, user.id, "/");
      parentId = rootDir?.id || null;
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

    // Create signed upload URL (valid for 2 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("private-files")
      .createSignedUploadUrl(storagePath);

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating signed upload URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    // Get file type category
    const fileType = MIME_TYPE_MAP[mimeType] || "other";

    return NextResponse.json({
      success: true,
      uploadUrl: signedUrlData.signedUrl,
      token: signedUrlData.token,
      // Return metadata needed to complete the upload
      uploadData: {
        storagePath,
        filePath,
        fileName: sanitizedFileName,
        originalFileName: fileName,
        mimeType: mimeType || "application/octet-stream",
        fileSize,
        fileType,
        parentId,
      },
    });
  } catch (error) {
    console.error("Error creating signed upload URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
