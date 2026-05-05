import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PipelineClient } from "./pipeline-client";
import type { JobApplication } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobsPipelinePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .schema("jg_app")
    .from("job_applications")
    .select("*")
    .order("updated_at", { ascending: false });

  return <PipelineClient initialData={(data ?? []) as JobApplication[]} />;
}
