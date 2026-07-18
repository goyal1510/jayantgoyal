import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SectionCopyManager } from "./section-copy-manager";

export const metadata: Metadata = { title: "Section Copy" };

export default async function SectionCopyPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("section_content")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Unable to load Portfolio section copy: ${error.message}`);
  }

  return <SectionCopyManager initialData={data ?? []} />;
}
