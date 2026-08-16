import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { loadExperienceWorkspace } from "@/lib/portfolio-workspace";
import { CertificatesList } from "../certificates/certificates-list";
import { ExperienceList } from "./experience-list";

export const metadata: Metadata = { title: "Experience" };

export default async function ExperiencePage() {
  const supabase = await createSupabaseServerClient();

  const { experience, certificates, editorial, editorialBySection } =
    await loadExperienceWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PortfolioWorkspaceHeader workspace="experience" />
      <SectionEditorialPanel sectionKey="experience" {...editorial} />
      <ExperienceList initialData={experience} />
      <SectionEditorialPanel
        sectionKey="credentials"
        title="Credentials presentation"
        description="Shape the certificate deck's heading and visibility alongside the experience it supports."
        {...editorialBySection.credentials!}
      />
      <CertificatesList initialData={certificates} />
    </div>
  );
}
