import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NavigationList } from "./navigation-list";

export const metadata: Metadata = { title: "Navigation" };

export default async function NavigationPage() {
  const supabase = await createSupabaseServerClient();

  const { data: navItems } = await supabase
    .schema("portfolio")
    .from("nav_items")
    .select("*")
    .in("section_id", [
      "about",
      "skills",
      "experience",
      "activity",
      "work",
      "writing",
    ])
    .order("sort_order", { ascending: true });

  return <NavigationList initialData={navItems ?? []} />;
}
