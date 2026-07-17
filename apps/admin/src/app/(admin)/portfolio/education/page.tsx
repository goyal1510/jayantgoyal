import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EducationList } from "./education-list";

export const metadata: Metadata = { title: "Education" };

export default async function EducationPage() {
  const supabase = await createSupabaseServerClient();

  const { data: education } = await supabase
    .schema("portfolio")
    .from("education")
    .select("*")
    .order("sort_order", { ascending: true });

  return <EducationList initialData={education ?? []} />;
}
