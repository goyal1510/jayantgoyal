import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ShortUrl } from "@/lib/types";
import { UrlsManager } from "./urls-manager";

export default async function AdminPage() {
  const adminClient = createSupabaseAdminClient();

  const { data: urls } = await adminClient
    .schema("url_shortener")
    .from("short_urls")
    .select("*")
    .order("created_at", { ascending: false });

  return <UrlsManager initialData={(urls as ShortUrl[]) ?? []} />;
}
