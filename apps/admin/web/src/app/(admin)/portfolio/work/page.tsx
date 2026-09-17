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
      <SectionEditorialPanel
        sectionKey="work"
        title="Work presentation"
        description="Featured work and archive framing. The count noun on the archive hero is the named label below, not a second phrase in Supporting text."
        {...editorial}
      />
      <WorkList
        initialData={work}
      />
    </div>
  );
}
