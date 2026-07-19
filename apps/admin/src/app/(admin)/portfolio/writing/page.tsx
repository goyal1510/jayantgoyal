import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { loadWritingWorkspace } from "@/lib/portfolio-workspace";
import { BlogList } from "../../blog/blog-list";

export const metadata: Metadata = { title: "Writing" };

export default async function WritingWorkspacePage() {
  const supabase = await createSupabaseServerClient();
  const { posts, editorial, editorialBySection } =
    await loadWritingWorkspace(supabase);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PortfolioWorkspaceHeader workspace="writing" />
      <SectionEditorialPanel sectionKey="writing" {...editorial} />
      <SectionEditorialPanel
        sectionKey="blog"
        title="Writing list presentation"
        description="Shape the public writing index without splitting its copy into a detached settings screen."
        {...editorialBySection.blog!}
      />
      <SectionEditorialPanel
        sectionKey="article"
        title="Article detail presentation"
        description="Shape the framing readers see when they open an individual article."
        {...editorialBySection.article!}
      />
      <BlogList initialData={posts ?? []} />
    </div>
  );
}
