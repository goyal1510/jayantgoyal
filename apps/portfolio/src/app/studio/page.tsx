import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkArchive } from "@/components/editorial/work-showcase";
import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

const STUDIO_PROJECT_SLUGS = new Set([
  "tech-tools",
  "file-manager",
  "game-hub",
  "activity-tracker",
  "sync-scratchpad",
  "custom-calculator",
  "currency-calculator",
  "weather",
]);

export async function generateMetadata(): Promise<Metadata> {
  const { pageContent } = await getEditorialPortfolioData();
  const content = pageContent.studio;

  return buildPublicPageMetadata({
    title: "Studio",
    description: content.description,
    pathname: "/studio",
  });
}

export default async function StudioPage() {
  const portfolio = await getEditorialPortfolioData();
  const content = portfolio.pageContent.studio;
  const work = portfolio.work.filter((project) =>
    STUDIO_PROJECT_SLUGS.has(project.id),
  );

  if (!content.isVisible) notFound();

  return (
    <main className="editorial-page editorial-work-page">
      <EditorialSubpageHeader
        brandLabel={portfolio.profile.displayName}
        navigation={portfolio.navigation}
      />
      <section className="shell editorial-page-hero editorial-work-hero">
        <span className="section-index">{content.eyebrow}</span>
        <div>
          <h1>{content.headline || "A small studio of useful products."}</h1>
          <p>{content.description}</p>
          <div className="editorial-work-hero__meta">
            <span>{String(work.length).padStart(2, "0")} studio products</span>
          </div>
        </div>
      </section>
      <WorkArchive work={work} backHref="/#studio" />
    </main>
  );
}
