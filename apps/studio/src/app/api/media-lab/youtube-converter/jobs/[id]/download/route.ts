import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMediaConverterUserAllowed } from "@/lib/media-lab/youtube-converter.server";

const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const SIGNED_URL_TTL_SECONDS = 5 * 60;

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const { data: job, error: jobError } = await supabase
      .schema("jg_app")
      .from("media_conversion_jobs")
      .select("status, storage_path, output_filename, expires_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (jobError) {
      console.error("Unable to fetch downloadable media conversion:", jobError);
      return NextResponse.json(
        { error: "Unable to prepare the download." },
        { status: 500 },
      );
    }
    if (!job) {
      return NextResponse.json(
        { error: "Conversion not found." },
        { status: 404 },
      );
    }
    if (
      job.status !== "completed" ||
      !job.storage_path ||
      !job.output_filename
    ) {
      return NextResponse.json(
        { error: "This conversion is not ready to download." },
        { status: 409 },
      );
    }
    if (job.expires_at && new Date(job.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "This temporary download has expired." },
        { status: 410 },
      );
    }

    const { data, error } = await supabase.storage
      .from("media-converter-output")
      .createSignedUrl(job.storage_path, SIGNED_URL_TTL_SECONDS, {
        download: job.output_filename,
      });

    if (error || !data?.signedUrl) {
      console.error("Unable to sign media conversion download:", error);
      return NextResponse.json(
        { error: "Unable to prepare the download." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        url: data.signedUrl,
        filename: job.output_filename,
        expiresAt: new Date(
          Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
        ).toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Error in POST /api/media-lab/youtube-converter/jobs/[id]/download:",
      error,
    );
    return NextResponse.json(
      { error: "Unable to prepare the download." },
      { status: 500 },
    );
  }
}
