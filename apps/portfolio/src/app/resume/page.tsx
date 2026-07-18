import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowDownToLine, ArrowUpRight } from "lucide-react";

import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { sectionContent } = await getPortfolioShellData();
  return buildPublicPageMetadata({
    title: "Resume",
    description: sectionContent.resume.description,
    pathname: "/resume",
  });
}

export default async function ResumePage() {
  const shell = await getPortfolioShellData();
  const content = shell.sectionContent.resume;
  if (!content.isVisible) notFound();

  return (
    <main className="editorial-page">
      <EditorialSubpageHeader
        brandLabel={shell.brandLabel}
        navigation={shell.navigation}
      />
      <section className="shell editorial-resume">
        <span className="section-index">{content.eyebrow}</span>
        <div>
          <h1>{content.headline}</h1>
          <p>{content.description}</p>
          <div className="editorial-resume__actions">
            <a href={shell.profile.resume}>
              Download latest resume <ArrowDownToLine aria-hidden="true" />
            </a>
            <Link href="/#experience">
              Explore the full story <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
