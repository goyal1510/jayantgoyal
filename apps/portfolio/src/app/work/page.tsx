import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkArchive } from "@/components/editorial/work-showcase";
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
        <div>
          <h1>Complete systems, built end to end.</h1>
          <p>{content.description}</p>
          <div className="editorial-work-hero__meta">
            <span>
              {String(portfolio.work.length).padStart(2, "0")} systems ·
              explained end to end
            </span>
            <Link href="#work-archive">Browse the systems</Link>
          </div>
        </div>
      </section>
      <WorkArchive work={portfolio.work} />
    </main>
  );
}
