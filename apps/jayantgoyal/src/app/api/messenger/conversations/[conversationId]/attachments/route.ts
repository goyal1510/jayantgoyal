import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFileStorageGate } from "@/lib/commerce/file-gates.server";

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  // eslint-disable-next-line no-control-regex
  return fileName.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
}

function safeStorageSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user.id;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const admin = createSupabaseAdminClient();
    const { data: participant, error: participantError } = await admin
      .schema("jg_app")
      .from("messenger_conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .is("left_at", null)
      .maybeSingle();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const fileName =
      typeof body.fileName === "string" ? sanitizeFileName(body.fileName) : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
    const mimeType =
      typeof body.mimeType === "string" && body.mimeType.trim()
        ? body.mimeType.trim()
        : "application/octet-stream";

    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    if (fileSize <= 0 || fileSize > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json(
        { error: "Attachment must be between 1 byte and 25MB" },
        { status: 400 }
      );
    }

    const storageGate = await getFileStorageGate({
      userId,
      incomingBytes: fileSize,
    });

    if (!storageGate.allowed) {
      return NextResponse.json(
        {
          error: "Storage limit reached. Upgrade to Pro for more messenger attachments.",
          code: "MESSENGER_STORAGE_LIMIT_REACHED",
          gate: storageGate,
        },
        { status: 402 }
      );
    }

    const attachmentId = randomUUID();
    const storagePath = [
      "messenger",
      userId,
      conversationId,
      `${attachmentId}-${safeStorageSegment(fileName)}`,
    ].join("/");

    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from("private-files")
      .createSignedUploadUrl(storagePath);

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating messenger attachment upload URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadUrl: signedUrlData.signedUrl,
      attachment: {
        id: attachmentId,
        bucket_id: "private-files",
        storage_path: storagePath,
        name: fileName,
        original_name: body.fileName,
        mime_type: mimeType,
        size_bytes: fileSize,
      },
    });
  } catch (error) {
    console.error("Error creating messenger attachment upload URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
