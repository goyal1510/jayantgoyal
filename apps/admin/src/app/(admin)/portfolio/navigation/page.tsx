import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NavigationList } from "./navigation-list";

export default async function NavigationPage() {
  const supabase = await createSupabaseServerClient();

  const { data: navItems } = await supabase
    .schema("portfolio")
    .from("nav_items")
    .select("*")
    .order("sort_order", { ascending: true });

  return <NavigationList initialData={navItems ?? []} />;
}
