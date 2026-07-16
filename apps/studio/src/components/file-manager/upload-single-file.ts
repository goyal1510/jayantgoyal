import type { UploadConflictInfo } from "@/components/file-manager/upload-conflict-dialog"

export async function uploadSingleFile(
  file: File,
  directoryPath: string,
  overwrite: boolean = false,
  rename: boolean = false
): Promise<{ success: boolean; error?: string; conflict?: UploadConflictInfo }> {
  try {
    // Step 1: Get signed upload URL from our API
    const signedUrlResponse = await fetch("/api/files/upload/signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        directoryPath,
        overwrite,
        rename,
      }),
    })

    const signedUrlData = await signedUrlResponse.json()

    if (!signedUrlResponse.ok) {
      if (signedUrlResponse.status === 409 && signedUrlData.code === "FILE_EXISTS") {
        return {
          success: false,
          conflict: {
            file,
            existingFile: signedUrlData.existingFile,
          },
        }
      }
      return { success: false, error: signedUrlData.error || "Failed to get upload URL" }
    }

    const { uploadUrl, uploadData } = signedUrlData

    // Step 2: Upload file directly to Supabase Storage using the signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Direct upload failed:", errorText)
      return { success: false, error: "Failed to upload file to storage" }
    }

    // Step 3: Complete the upload by creating the file record
    const completeResponse = await fetch("/api/files/upload/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(uploadData),
    })

    const completeData = await completeResponse.json()

    if (!completeResponse.ok || !completeData.success) {
      return { success: false, error: completeData.error || "Failed to complete upload" }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Upload failed" }
  }
}
