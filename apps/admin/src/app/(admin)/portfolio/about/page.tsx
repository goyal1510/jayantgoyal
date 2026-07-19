import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { loadAboutWorkspace } from "@/lib/portfolio-workspace";
import { EducationList } from "../education/education-list";
import { AboutForm } from "./about-form";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const supabase = await createSupabaseServerClient();

  const { about, education, editorial, editorialBySection } =
    await loadAboutWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PortfolioWorkspaceHeader workspace="about" />
      <SectionEditorialPanel sectionKey="about" {...editorial} />
      <AboutForm initialData={about} />
      <SectionEditorialPanel
        sectionKey="education"
        title="Education presentation"
        description="Shape the heading and visibility for the education timeline without leaving the About workspace."
        {...editorialBySection.education!}
      />
      <EducationList initialData={education} />
    </div>
  );
}
