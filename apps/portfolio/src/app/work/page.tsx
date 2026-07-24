import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { ProjectArchive } from "@/components/editorial/project-showcase";
import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { sectionContent } = await getEditorialPortfolioData();
  const content = sectionContent.work;

  return buildPublicPageMetadata({
    title: "Work",
    description: content.description,
    pathname: "/work",
  });
}

export default async function WorkPage() {
  const portfolio = await getEditorialPortfolioData();
  const content = portfolio.sectionContent.work;
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
          <h1>All the work, in one place.</h1>
          <p>{content.description}</p>
          <div className="editorial-work-hero__meta">
            <span>
              {String(portfolio.projects.length).padStart(2, "0")} projects ·
              newest first
            </span>
            <Link href="/#work">
              <ArrowLeft aria-hidden="true" />
              Featured work
            </Link>
          </div>
        </div>
      </section>
      <ProjectArchive projects={portfolio.projects} />
    </main>
  );
}
