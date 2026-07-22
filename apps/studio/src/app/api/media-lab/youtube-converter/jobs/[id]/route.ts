import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  toMediaConversionJob,
  type MediaConversionJobRow,
} from "@/lib/media-lab/youtube-converter";
import { isMediaConverterUserAllowed } from "@/lib/media-lab/youtube-converter.server";

const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const MEDIA_JOB_SELECT =
  "id, source_url, output_format, quality, status, progress, title, output_filename, mime_type, size_bytes, error_message, created_at, completed_at, expires_at";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!JOB_ID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isMediaConverterUserAllowed(user)) {
      return NextResponse.json(
        { error: "This private converter is not enabled for your account." },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .schema("jg_app")
      .from("media_conversion_jobs")
      .select(MEDIA_JOB_SELECT)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Unable to fetch media conversion job:", error);
      return NextResponse.json(
        { error: "Unable to check conversion progress." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { error: "Conversion not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { job: toMediaConversionJob(data as unknown as MediaConversionJobRow) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Error in GET /api/media-lab/youtube-converter/jobs/[id]:",
      error,
    );
    return NextResponse.json(
      { error: "Unable to check conversion progress." },
      { status: 500 },
    );
  }
}
