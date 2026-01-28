import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TechIconsList } from "./tech-icons-list";

export default async function TechIconsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: techIcons } = await supabase
    .schema("portfolio")
    .from("tech_icons")
    .select("*")
    .order("sort_order", { ascending: true });

  return <TechIconsList initialData={techIcons ?? []} />;
}
