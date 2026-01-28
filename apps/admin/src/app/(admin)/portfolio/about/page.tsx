import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AboutForm } from "./about-form";

export default async function AboutPage() {
  const supabase = await createSupabaseServerClient();

  const { data: about } = await supabase
    .schema("portfolio")
    .from("about")
    .select("*")
    .single();

  return <AboutForm initialData={about} />;
}
