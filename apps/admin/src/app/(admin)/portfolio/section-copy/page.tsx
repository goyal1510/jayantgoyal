import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SectionCopyManager } from "./section-copy-manager";

export const metadata: Metadata = { title: "Section Copy" };

export default async function SectionCopyPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("section_content")
    .select("*");

  if (error) {
    throw new Error(`Unable to load Portfolio section copy: ${error.message}`);
  }

  const order = [
    "hero",
    "about",
    "skills",
    "education",
    "experience",
    "credentials",
    "activity",
    "work",
    "writing",
    "contact",
    "blog",
    "article",
    "resume",
  ];
  const sections = [...(data ?? [])].sort(
    (a, b) => order.indexOf(a.section_key) - order.indexOf(b.section_key),
  );

  return <SectionCopyManager initialData={sections} />;
}
