/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";

import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

async function getPublishedCaseStudy(slug: string) {
  const portfolio = await getEditorialPortfolioData();
  const project = portfolio.work.find((item) => item.id === slug);

  if (!project?.caseStudy) return null;
  return { portfolio, project, caseStudy: project.caseStudy };
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

  const { portfolio, project, caseStudy } = result;

  return (
    <main className="editorial-page editorial-case-study">
      <EditorialSubpageHeader
        brandLabel={portfolio.profile.displayName}
        navigation={portfolio.navigation}
      />

      <article>
        <header className="shell case-study-hero">
          <div className="case-study-hero__intro">
            <span className="section-index">
              Work / {project.eyebrow}
            </span>
            <h1>{project.title}</h1>
            <p>{project.summary}</p>
          </div>
          <div className="case-study-hero__outcome">
            <span>Outcome</span>
            <p>{project.impact}</p>
          </div>
        </header>

        <figure className="shell case-study-visual">
          <img src={project.image} alt={project.imageAlt} />
          <figcaption>
            <span>{project.year}</span>
            <span>{project.role}</span>
          </figcaption>
        </figure>

        <div className="shell case-study-facts">
          <div>
            <span>Role</span>
            <strong>{project.role}</strong>
          </div>
          <div>
            <span>Working set</span>
            <ul aria-label="Technologies">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
          <div className="case-study-facts__links">
            <span>Product</span>
            {project.href ? (
              <a href={project.href} target="_blank" rel="noreferrer">
                Live product <ArrowUpRight aria-hidden="true" />
              </a>
            ) : null}
            {project.github ? (
              <a href={project.github} target="_blank" rel="noreferrer">
                Source <Github aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="shell case-study-body">
          <section>
            <span className="section-index">01 / Problem</span>
            <h2>The product tension</h2>
            <p>{caseStudy.problem}</p>
          </section>
          <section>
            <span className="section-index">02 / Solution</span>
            <h2>What I built</h2>
            <p>{caseStudy.solution}</p>
          </section>
          <section className="case-study-body__wide">
            <span className="section-index">03 / Architecture</span>
            <h2>How the system fits together</h2>
            <p>{caseStudy.architecture}</p>
          </section>
          <section className="case-study-decisions">
            <span className="section-index">04 / Decisions</span>
            <h2>Key engineering decisions</h2>
            <ol>
              {caseStudy.decisions.map((decision, index) => (
                <li key={decision.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{decision.title}</h3>
                    <p>{decision.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <span className="section-index">05 / Security</span>
            <h2>Trust boundaries</h2>
            <p>{caseStudy.security}</p>
          </section>
          <section>
            <span className="section-index">06 / Tradeoffs</span>
            <h2>What I chose—and accepted</h2>
            <p>{caseStudy.tradeoffs}</p>
          </section>
          <section>
            <span className="section-index">07 / Outcome</span>
            <h2>Why the work matters</h2>
            <p>{caseStudy.outcome}</p>
          </section>
          <section>
            <span className="section-index">08 / Next</span>
            <h2>What I would improve next</h2>
            <p>{caseStudy.nextImprovement}</p>
          </section>
        </div>

        <div className="shell case-study-back">
          <Link href="/work">
            <ArrowLeft aria-hidden="true" />
            Back to all Work
          </Link>
        </div>
      </article>
    </main>
  );
}
