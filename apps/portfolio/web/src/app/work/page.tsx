import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSectionLabel } from "@jayantgoyal/portfolio-contracts";
import { WorkArchive } from "@/components/editorial/work-showcase";
import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const revalidate = 60;

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
  const countNoun = getSectionLabel(content.labels, "countNoun", "public systems");

  return (
    <main className="editorial-page editorial-work-page">
      <EditorialSubpageHeader
        brandLabel={portfolio.profile.displayName}
        navigation={portfolio.navigation}
        contact={portfolio.sectionContent.contact}
      />
      <section className="shell editorial-page-hero editorial-work-hero">
        <div>
          <h1>{content.headline}</h1>
          <p>{content.description}</p>
          <div className="editorial-work-hero__meta">
            <span>
              {String(portfolio.work.length).padStart(2, "0")} {countNoun}
            </span>
            <Link href="#work-archive">{content.accent || "Browse the archive"}</Link>
          </div>
        </div>
      </section>
      <WorkArchive
        work={portfolio.work}
        backLabel={
          portfolio.sectionContent.home.supportingText || "Back to home"
        }
      />
    </main>
  );
}
