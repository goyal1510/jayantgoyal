import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const adminClient = createSupabaseAdminClient();

  const { data: shortUrl, error } = await adminClient
    .schema("url_shortener")
    .from("short_urls")
    .select("id, target_url, is_active")
    .eq("slug", slug)
    .single();

  if (error || !shortUrl || !shortUrl.is_active) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/not-found`, 302);
  }

  // Fire-and-forget: increment clicks + insert click event
  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");

  adminClient.rpc("increment_clicks", { url_id: shortUrl.id }, { schema: "url_shortener" }).then();

  adminClient
    .schema("url_shortener")
    .from("click_events")
    .insert({
      short_url_id: shortUrl.id,
      user_agent: userAgent,
      referer: referer,
    })
    .then();

  return NextResponse.redirect(shortUrl.target_url, 307);
}
