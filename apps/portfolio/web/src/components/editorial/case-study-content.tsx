"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";

import { ProjectMediaGallery } from "@/components/editorial/project-media-gallery";
import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { trackPortfolioEvent } from "@/lib/analytics/events";
import type {
  PortfolioNavigationItem,
  PortfolioWork,
} from "@/lib/portfolio/editorial-data";

type CaseStudyContent = NonNullable<PortfolioWork["caseStudy"]>;

type CaseStudySection = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  content: string;
};

function buildSections(caseStudy: CaseStudyContent): CaseStudySection[] {
  return [
    {
      id: "problem",
      label: "Product tension",
      eyebrow: "Problem",
      title: "The product tension",
      content: caseStudy.problem,
    },
    {
      id: "solution",
      label: "What I built",
      eyebrow: "Solution",
      title: "What I built",
      content: caseStudy.solution,
    },
    {
      id: "architecture",
      label: "System shape",
      eyebrow: "Architecture",
      title: "How the system fits together",
      content: caseStudy.architecture,
    },
    {
      id: "decisions",
      label: "Engineering decisions",
      eyebrow: "Decisions",
      title: "The calls that shaped the build",
      content: "",
    },
    {
      id: "security",
      label: "Trust boundaries",
      eyebrow: "Security",
      title: "Trust boundaries",
      content: caseStudy.security,
    },
    {
      id: "tradeoffs",
      label: "Tradeoffs",
      eyebrow: "Tradeoffs",
      title: "What I chose—and accepted",
      content: caseStudy.tradeoffs,
    },
    {
      id: "outcome",
      label: "Outcome",
      eyebrow: "Outcome",
      title: "Why the work matters",
      content: caseStudy.outcome,
    },
    {
      id: "next",
      label: "Next iteration",
      eyebrow: "Next",
      title: "What I would improve next",
      content: caseStudy.nextImprovement,
    },
  ];
}

export function CaseStudyContent({
  brandLabel,
  navigation,
  project,
  nextProject,
}: {
  brandLabel: string;
  navigation: PortfolioNavigationItem[];
  project: PortfolioWork;
  nextProject: PortfolioWork | null;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const caseStudy = project.caseStudy;
  const sections = useMemo(
    () => (caseStudy ? buildSections(caseStudy) : []),
    [caseStudy],
  );

  useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeading = entries.find((entry) => entry.isIntersecting);
        if (visibleHeading) setActiveSection(visibleHeading.target.id);
      },
      { rootMargin: "-18% 0px -68%", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    setActiveSection(headings[0]?.id ?? null);

    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    if (!caseStudy) return;

    trackPortfolioEvent("view_item", {
      content_type: "work_case_study",
      item_id: project.id,
      item_name: project.title,
    });
  }, [caseStudy, project.id, project.title]);

  if (!caseStudy) return null;

  return (
    <main className="editorial-page editorial-case-study editorial-work-article-page">
      <EditorialSubpageHeader brandLabel={brandLabel} navigation={navigation} />

      <article className="shell editorial-article editorial-work-article">
        <header className="editorial-article__header">
          <div className="editorial-article__meta">
            <span className="section-index">Work / {project.eyebrow}</span>
            <span>{project.year}</span>
          </div>

          <div className="editorial-article__headline">
            <h1>{project.title}</h1>
            <div className="editorial-article__summary">
              <p>{project.summary}</p>
              <div className="editorial-article__reading-meta">
                <span>{project.role}</span>
                <span>End-to-end case study</span>
              </div>
              <ul aria-label="Technologies">
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          </div>
        </header>

        <figure className="editorial-article__cover editorial-work-article__cover">
          <div className="editorial-work-article__image-frame">
            <ProjectMediaGallery
              images={project.images}
              alt={project.imageAlt}
              eager
            />
          </div>
          <figcaption>
            <span>{project.impact}</span>
            <span>
              {project.year} · {project.role}
            </span>
          </figcaption>
        </figure>

        <div className="editorial-reading-layout editorial-work-article__reading-layout">
          <aside className="editorial-article__toc" aria-label="On this page">
            <div>
              <span className="section-index">Inside this study</span>
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={
                        activeSection === section.id ? "location" : undefined
                      }
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div className="editorial-prose editorial-case-study-prose">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <span className="section-index">
                  {String(sections.indexOf(section) + 1).padStart(2, "0")} /{" "}
                  {section.eyebrow}
                </span>
                <h2>{section.title}</h2>
                {section.id === "decisions" ? (
                  <ol className="case-study-decisions">
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
                ) : (
                  <p>{section.content}</p>
                )}
              </section>
            ))}
          </div>

          <aside
            className="editorial-article__facts"
            aria-label="Project details"
          >
            <div>
              <span className="section-index">Project details</span>
              <dl>
                <div>
                  <dt>Role</dt>
                  <dd>{project.role}</dd>
                </div>
                <div>
                  <dt>Product type</dt>
                  <dd>{project.eyebrow}</dd>
                </div>
                <div>
                  <dt>Built with</dt>
                  <dd>{project.tags.join(" · ")}</dd>
                </div>
              </dl>
              <div className="editorial-work-article__links">
                {project.href ? (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    data-analytics-event="select_content"
                    data-analytics-source="work_case_study"
                    data-analytics-content-type="live_product"
                    data-analytics-item-id={project.id}
                    data-analytics-item-name={project.title}
                  >
                    {project.id === "admin" ? "Private app" : "Open product"}{" "}
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : null}
                {project.github ? (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    data-analytics-event="select_content"
                    data-analytics-source="work_case_study"
                    data-analytics-content-type="source_code"
                    data-analytics-item-id={project.id}
                    data-analytics-item-name={project.title}
                  >
                    Source <Github aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        <footer className="editorial-article__footer">
          <div className="editorial-article__signoff">
            <span className="section-index">Build with intent</span>
            <h2>Have a product with this kind of problem?</h2>
            <p>
              {project.impact} Start with the constraints, then make the system
              dependable.
            </p>
            <div className="editorial-article__signoff-actions">
              <Link
                href={`/contact?source=work-case-study&project=${encodeURIComponent(project.id)}`}
                data-analytics-event="contact_intent"
                data-analytics-source="work_case_study"
                data-analytics-content-type="contact_form"
                data-analytics-item-id={project.id}
                data-analytics-item-name={project.title}
              >
                Discuss a product <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link
                href="/resume"
                data-analytics-event="select_content"
                data-analytics-source="work_case_study"
                data-analytics-content-type="resume"
                data-analytics-item-id={project.id}
                data-analytics-item-name={project.title}
              >
                View résumé <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </div>

          {nextProject ? (
            <Link
              className="editorial-article__next"
              href={`/work/${nextProject.id}`}
              data-analytics-event="select_content"
              data-analytics-source="work_case_study"
              data-analytics-content-type="next_case_study"
              data-analytics-item-id={nextProject.id}
              data-analytics-item-name={nextProject.title}
            >
              <span className="section-index">Continue through the work</span>
              <h2>{nextProject.title}</h2>
              <p>{nextProject.summary}</p>
              <span className="editorial-article__next-action">
                Next case study <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <Link className="editorial-article__next" href="/work">
              <span className="section-index">Keep exploring</span>
              <h2>Return to the complete work archive.</h2>
              <span className="editorial-article__next-action">
                All work <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          )}
        </footer>
      </article>
    </main>
  );
}
