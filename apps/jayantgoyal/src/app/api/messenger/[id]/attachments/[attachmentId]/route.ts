import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/messenger/database.types";

type MessengerAttachment = {
  id: string;
  bucket_id?: string;
  storage_path: string;
};

function getAttachments(metadata: Json): MessengerAttachment[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const attachments = metadata.attachments;

  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.filter((attachment): attachment is MessengerAttachment => {
    if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) {
      return false;
    }

    return (
      typeof attachment.id === "string" &&
      typeof attachment.storage_path === "string"
    );
  });
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId, attachmentId } = await params;
    const admin = createSupabaseAdminClient();
    const { data: message, error: messageError } = await admin
      .schema("jg_app")
      .from("messenger_messages")
      .select("id,user_id,sender_id,conversation_id,metadata")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.conversation_id) {
      const { data: participant, error: participantError } = await admin
        .schema("jg_app")
        .from("messenger_conversation_participants")
        .select("id")
        .eq("conversation_id", message.conversation_id)
        .eq("user_id", userId)
        .is("left_at", null)
        .maybeSingle();

      if (participantError || !participant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if ((message.sender_id ?? message.user_id) !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attachment = getAttachments(message.metadata).find(
      (item) => item.id === attachmentId
    );

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from(attachment.bucket_id || "private-files")
      .createSignedUrl(attachment.storage_path, 60);

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating messenger attachment download URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to open attachment" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("Error opening messenger attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
