import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExperienceList } from "./experience-list";

export default async function ExperiencePage() {
  const supabase = await createSupabaseServerClient();

  const { data: experience } = await supabase
    .schema("portfolio")
    .from("experience")
    .select("*")
    .order("sort_order", { ascending: true });

  return <ExperienceList initialData={experience ?? []} />;
}
