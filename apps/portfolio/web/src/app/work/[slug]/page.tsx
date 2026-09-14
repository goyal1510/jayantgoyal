import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaseStudyContent } from "@/components/editorial/case-study-content";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

async function getPublishedCaseStudy(slug: string) {
  const portfolio = await getEditorialPortfolioData();
  const project = portfolio.work.find((item) => item.id === slug);

  if (!project?.caseStudy) return null;
  return { portfolio, project };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedCaseStudy(slug);
  if (!result) return {};

  return buildPublicPageMetadata({
    title: `${result.project.title} Case Study`,
    description: result.project.summary,
    pathname: `/work/${result.project.id}`,
  });
}

export default async function WorkCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublishedCaseStudy(slug);
  if (!result) notFound();

  const { portfolio, project } = result;
  const currentIndex = portfolio.work.findIndex(
    (item) => item.id === project.id,
  );
  const nextProject =
    currentIndex >= 0
      ? (portfolio.work
          .slice(currentIndex + 1)
          .find((item) => item.caseStudy) ?? null)
      : null;

  return (
    <CaseStudyContent
      brandLabel={portfolio.profile.displayName}
      navigation={portfolio.navigation}
      project={project}
      nextProject={nextProject}
    />
  );
}
