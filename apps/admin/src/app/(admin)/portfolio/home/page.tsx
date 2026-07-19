import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { loadHomeWorkspace } from "@/lib/portfolio-workspace";
import { HeroForm } from "../hero/hero-form";

export const metadata: Metadata = { title: "Home" };

export default async function HomeWorkspacePage() {
  const supabase = await createSupabaseServerClient();
  const { hero, editorial, editorialBySection } =
    await loadHomeWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PortfolioWorkspaceHeader workspace="home" />
      <SectionEditorialPanel sectionKey="hero" {...editorial} />
      <HeroForm initialData={hero} />
      <SectionEditorialPanel
        sectionKey="resume"
        title="Resume presentation"
        description="Shape the heading and supporting copy for the public resume page alongside its source link."
        {...editorialBySection.resume!}
      />
    </div>
  );
}
