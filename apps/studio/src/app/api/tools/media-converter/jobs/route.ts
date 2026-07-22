import { after, NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isConversionQuality,
  isOutputFormat,
  MEDIA_CONVERSION_ACTIVE_STATUSES,
  normalizeYouTubeUrl,
  toMediaConversionJob,
  type MediaConversionJobRow,
} from "@/lib/tools/media-converter";
import {
  isMediaConverterUserAllowed,
  wakeMediaWorker,
} from "@/lib/tools/media-converter.server";

const MEDIA_JOB_SELECT =
  "id, source_url, output_format, quality, status, progress, title, output_filename, mime_type, size_bytes, error_message, created_at, completed_at, expires_at";

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function getAuthorizedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { error: "unauthorized" as const };
  if (!isMediaConverterUserAllowed(user)) {
    return { error: "forbidden" as const };
  }
  return { supabase, user };
}

export async function GET() {
  try {
    const context = await getAuthorizedContext();
    if (context.error === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (context.error === "forbidden") {
      return NextResponse.json(
        { error: "This private converter is not enabled for your account." },
        { status: 403 },
      );
    }

    const { data, error } = await context.supabase
      .schema("jg_app")
      .from("media_conversion_jobs")
      .select(MEDIA_JOB_SELECT)
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("Unable to fetch media conversion jobs:", error);
      return NextResponse.json(
        { error: "Media conversion storage is not ready." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        jobs: ((data ?? []) as unknown as MediaConversionJobRow[]).map(
          toMediaConversionJob,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error in GET /api/tools/media-converter/jobs:", error);
    return NextResponse.json(
      { error: "Unable to load media conversion jobs." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = await getAuthorizedContext();
    if (context.error === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (context.error === "forbidden") {
      return NextResponse.json(
        { error: "This private converter is not enabled for your account." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      url?: unknown;
      outputFormat?: unknown;
      quality?: unknown;
      rightsConfirmed?: unknown;
    };
    const sourceUrl =
      typeof body.url === "string" ? normalizeYouTubeUrl(body.url) : null;

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Enter a valid YouTube video or Shorts link." },
        { status: 400 },
      );
    }
    if (!isOutputFormat(body.outputFormat)) {
      return NextResponse.json(
        { error: "Choose MP3 or MP4 output." },
        { status: 400 },
      );
    }
    if (!isConversionQuality(body.quality)) {
      return NextResponse.json(
        { error: "Choose a supported quality." },
        { status: 400 },
      );
    }
    if (body.rightsConfirmed !== true) {
      return NextResponse.json(
        { error: "Confirm that you own or may download this media." },
        { status: 400 },
      );
    }

    const { data: activeJob, error: activeJobError } = await context.supabase
      .schema("jg_app")
      .from("media_conversion_jobs")
      .select("id")
      .eq("user_id", context.user.id)
      .in("status", [...MEDIA_CONVERSION_ACTIVE_STATUSES])
      .maybeSingle();

    if (activeJobError) {
      console.error(
        "Unable to check active media conversion job:",
        activeJobError,
      );
      return NextResponse.json(
        { error: "Media conversion storage is not ready." },
        { status: 503 },
      );
    }
    if (activeJob) {
      return NextResponse.json(
        {
          error:
            "Wait for the current conversion to finish before starting another.",
        },
        { status: 409 },
      );
    }

    const { data, error } = await context.supabase
      .schema("jg_app")
      .from("media_conversion_jobs")
      .insert({
        user_id: context.user.id,
        source_url: sourceUrl,
        output_format: body.outputFormat,
        quality: body.quality,
      })
      .select(MEDIA_JOB_SELECT)
      .single();

    if (error || !data) {
      console.error("Unable to enqueue media conversion job:", error);
      const isActiveConflict = error?.code === "23505";
      return NextResponse.json(
        {
          error: isActiveConflict
            ? "Wait for the current conversion to finish before starting another."
            : "Unable to start the conversion.",
        },
        { status: isActiveConflict ? 409 : 500 },
      );
    }

    after(() => wakeMediaWorker());

    return NextResponse.json(
      { job: toMediaConversionJob(data as unknown as MediaConversionJobRow) },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error in POST /api/tools/media-converter/jobs:", error);
    return NextResponse.json(
      { error: "Unable to start the conversion." },
      { status: 500 },
    );
  }
}
