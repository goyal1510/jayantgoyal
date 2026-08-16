import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";

import { ProjectMediaGallery } from "@/components/editorial/project-media-gallery";
import type {
  PortfolioWork,
  PortfolioSectionContent,
} from "@/lib/portfolio/editorial-data";
import { getFeaturedWork } from "@/lib/portfolio/featured-work";
import { getCompactSectionHeading } from "@/lib/portfolio/section-heading";

function WorkArtwork({
  project,
  eager = false,
  className = "",
}: {
  project: PortfolioWork;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div className={`project-artwork ${className}`.trim()}>
      <div className="torn-sheet">
        <div className="torn-sheet__image">
          <ProjectMediaGallery
            images={project.images}
            alt={project.imageAlt}
            eager={eager}
          />
        </div>
      </div>
    </div>
  );
}

function WorkLinks({
  project,
  className,
}: {
  project: PortfolioWork;
  className: string;
}) {
  if (!project.caseStudy && !project.href && !project.github) return null;

  return (
    <div className={className}>
      {project.caseStudy ? (
        <Link
          href={`/work/${project.id}`}
          data-analytics-event="select_content"
          data-analytics-source="work_card"
          data-analytics-content-type="work_case_study"
          data-analytics-item-id={project.id}
          data-analytics-item-name={project.title}
        >
          Details <ArrowUpRight aria-hidden="true" />
        </Link>
      ) : null}
      {project.href ? (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          data-analytics-event="select_content"
          data-analytics-source="work_card"
          data-analytics-content-type="live_product"
          data-analytics-item-id={project.id}
          data-analytics-item-name={project.title}
        >
          {project.id === "admin" ? "Private app" : "Open system"}{" "}
          <ArrowUpRight aria-hidden="true" />
        </a>
      ) : null}
      {project.github ? (
        <a
          href={project.github}
          target="_blank"
          rel="noreferrer"
          data-analytics-event="select_content"
          data-analytics-source="work_card"
          data-analytics-content-type="source_code"
          data-analytics-item-id={project.id}
          data-analytics-item-name={project.title}
        >
          Source <Github aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

export function FeaturedWork({
  work,
  content,
}: {
  work: PortfolioWork[];
  content: PortfolioSectionContent;
}) {
  const featuredWork = getFeaturedWork(work);
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);

  return (
    <section id="work" className="project-desk project-desk--featured">
      <div className="shell">
        <div className="section-heading section-heading--light">
          <span className="section-index">{heading.label}</span>
          <div>
            <h2>{heading.title}</h2>
            <p>{content.description}</p>
          </div>
        </div>

        <div className="featured-project-grid">
          {featuredWork.map((project, index) => (
            <article
              key={project.id}
              className={`featured-project project-story--${project.tone}`}
            >
              <WorkArtwork
                project={project}
                eager={index < 2}
                className="featured-project__artwork"
              />
              <div className="featured-project__copy">
                <div className="featured-project__meta">
                  <span>{project.eyebrow}</span>
                  <span>{project.year}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="featured-project__footer">
                  <ul aria-label="Technologies">
                    {project.tags.slice(0, 3).map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <WorkLinks
                    project={project}
                    className="featured-project__links"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="featured-projects__archive-link">
          <span>Four systems, each explained from problem to outcome</span>
          <Link href="/work" data-cursor="Explore">
            View all Work
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function WorkArchive({
  work,
  backHref = "/",
  backLabel = "Back to home",
}: {
  work: PortfolioWork[];
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section
      id="work-archive"
      className="project-desk project-desk--archive"
      aria-label="Work archive"
    >
      <div className="shell">
        <div className="project-stories project-stories--archive">
          {work.map((project) => (
            <div
              key={project.id}
              className={`project-story project-story--${project.tone}`}
            >
              <article>
                <WorkArtwork
                  project={project}
                  eager
                  className="project-fragment"
                />
                <div className="project-story__copy">
                  <div className="project-story__meta">
                    <span>{project.eyebrow}</span>
                    <span>{project.year}</span>
                  </div>
                  <h2>{project.title}</h2>
                  <p className="project-story__summary">{project.summary}</p>
                  <p className="project-story__impact">{project.impact}</p>
                  <ul aria-label="Technologies">
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <p className="project-story__role">{project.role}</p>
                  <WorkLinks
                    project={project}
                    className="project-story__links"
                  />
                </div>
              </article>
            </div>
          ))}
        </div>

        <Link className="project-archive__back" href={backHref}>
          <ArrowLeft aria-hidden="true" />
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
