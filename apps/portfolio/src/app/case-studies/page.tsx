import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkArchive } from "@/components/editorial/work-showcase";
import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { pageContent } = await getEditorialPortfolioData();
  const content = pageContent["case-studies"];

  return buildPublicPageMetadata({
    title: "Case Studies",
    description: content.description,
    pathname: "/case-studies",
  });
}

export default async function CaseStudiesPage() {
  const portfolio = await getEditorialPortfolioData();
  const content = portfolio.pageContent["case-studies"];
  const work = portfolio.work.filter((project) => project.caseStudy);

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
          <h1>{content.headline || "Case studies with the decisions exposed."}</h1>
          <p>{content.description}</p>
          <div className="editorial-work-hero__meta">
            <span>{String(work.length).padStart(2, "0")} published case studies</span>
          </div>
        </div>
      </section>
      <WorkArchive
        work={work}
        backHref="/"
        backLabel="Back to home"
      />
    </main>
  );
}
