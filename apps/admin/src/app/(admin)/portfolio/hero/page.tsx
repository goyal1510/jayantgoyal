import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HeroForm } from "./hero-form";

export default async function HeroPage() {
  const supabase = await createSupabaseServerClient();

  const { data: hero } = await supabase
    .schema("portfolio")
    .from("hero")
    .select("*")
    .single();

  return <HeroForm initialData={hero} />;
}
