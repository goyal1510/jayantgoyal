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
  const resumeHref = "/api/resume";

  return (
    <main className="editorial-page">
      <EditorialSubpageHeader
        brandLabel={shell.brandLabel}
        navigation={shell.navigation}
      />
      <section className="shell editorial-page-hero editorial-resume-hero">
        <div>
          <h1>{content.headline}</h1>
          <div className="editorial-resume__copy">
            <p>{content.description}</p>
            <div className="editorial-resume__actions">
              <a
                href={resumeHref}
                download="Jayant_Resume.pdf"
                data-analytics-event="file_download"
                data-analytics-source="resume_page"
                data-analytics-content-type="resume_pdf"
                data-analytics-item-name="Jayant resume"
              >
                Download PDF <ArrowDownToLine aria-hidden="true" />
              </a>
              <Link href="/about#experience">
                View experience <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="shell editorial-resume__viewer">
        <div className="editorial-resume__viewer-heading">
          <span className="section-index">PDF preview</span>
          <p>Read the current PDF here or download a copy for later.</p>
        </div>
        <iframe
          src={resumeHref}
          title="Jayant resume PDF"
          className="editorial-resume__frame"
        />
      </section>
    </main>
  );
}
