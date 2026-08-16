import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { loadWorkWorkspace } from "@/lib/portfolio-workspace";
import { WorkList } from "../work/work-list";

export const metadata: Metadata = { title: "Work" };

export default async function WorkWorkspacePage() {
  const supabase = await createSupabaseServerClient();
  const { work, editorial } = await loadWorkWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PortfolioWorkspaceHeader workspace="work" />
      <SectionEditorialPanel sectionKey="work" {...editorial} />
      <WorkList
        initialData={work}
      />
    </div>
  );
}
