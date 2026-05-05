import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SourcesClient } from "./sources-client";
import type { JobSource } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobsSourcesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .schema("jg_app")
    .from("job_sources")
    .select("*")
    .order("kind", { ascending: true })
    .order("label", { ascending: true });

  return <SourcesClient initialData={(data ?? []) as JobSource[]} />;
}
