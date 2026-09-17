import type { Metadata } from "next";

import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAnalyticsWorkspace } from "@/lib/portfolio-workspace";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsWorkspacePage() {
  const supabase = await createSupabaseServerClient();
  const { editorial } = await loadAnalyticsWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PortfolioWorkspaceHeader workspace="analytics" />
      <SectionEditorialPanel
        sectionKey="analytics"
        title="Analytics presentation"
        description="Copy and menu visibility for the public /analytics page. GitHub contributions stay on the GitHub workspace."
        {...editorial}
      />
    </div>
  );
}
