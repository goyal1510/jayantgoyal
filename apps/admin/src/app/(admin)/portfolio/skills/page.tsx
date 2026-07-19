import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { loadSkillsWorkspace } from "@/lib/portfolio-workspace";
import { SkillsManager } from "./skills-manager";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const supabase = await createSupabaseServerClient();

  const { categories, editorial } = await loadSkillsWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PortfolioWorkspaceHeader workspace="skills" />
      <SectionEditorialPanel sectionKey="skills" {...editorial} />
      <SkillsManager initialData={categories} />
    </div>
  );
}
