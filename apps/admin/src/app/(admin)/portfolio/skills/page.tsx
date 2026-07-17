import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SkillsManager } from "./skills-manager";
import type { SkillCategoryWithSkills } from "@/lib/types";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .schema("portfolio")
    .from("skill_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: skills } = await supabase
    .schema("portfolio")
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true });

  // Combine categories with their skills
  const categoriesWithSkills: SkillCategoryWithSkills[] = (
    categories ?? []
  ).map((cat) => ({
    ...cat,
    skills: (skills ?? []).filter((s) => s.category_id === cat.id),
  }));

  return <SkillsManager initialData={categoriesWithSkills} />;
}
