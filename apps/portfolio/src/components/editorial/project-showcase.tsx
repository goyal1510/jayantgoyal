/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";

import type {
  PortfolioProject,
  PortfolioSectionContent,
} from "@/lib/portfolio/editorial-data";
import { getCompactSectionHeading } from "@/lib/portfolio/section-heading";

function ProjectArtwork({
  project,
  eager = false,
  className = "",
}: {
  project: PortfolioProject;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div className={`project-artwork ${className}`.trim()}>
      <div className="torn-sheet">
        <div className="torn-sheet__image">
          <img
            src={project.image}
            alt={project.imageAlt}
            loading={eager ? "eager" : "lazy"}
          />
        </div>
      </div>
    </div>
  );
}

function ProjectLinks({
  project,
  className,
}: {
  project: PortfolioProject;
  className: string;
}) {
  if (!project.href && !project.github) return null;

  return (
    <div className={className}>
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
  );
}

export function FeaturedProjects({
  projects,
  content,
}: {
  projects: PortfolioProject[];
  content: PortfolioSectionContent;
}) {
  const featuredProjects = projects.slice(0, 4);
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
          {featuredProjects.map((project, index) => (
            <article
              key={project.id}
              className={`featured-project project-story--${project.tone}`}
            >
              <ProjectArtwork
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
                  <ProjectLinks
                    project={project}
                    className="featured-project__links"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        {projects.length > featuredProjects.length ? (
          <div className="featured-projects__archive-link">
            <span>
              {String(projects.length - featuredProjects.length).padStart(
                2,
                "0",
              )}{" "}
              more projects in the archive
            </span>
            <Link href="/work" data-cursor="Explore">
              View all {projects.length} projects
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ProjectArchive({ projects }: { projects: PortfolioProject[] }) {
  return (
    <section
      className="project-desk project-desk--archive"
      aria-label="All projects"
    >
      <div className="shell">
        <div className="project-stories project-stories--archive">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className={`project-story project-story--${project.tone}`}
            >
              <article>
                <ProjectArtwork
                  project={project}
                  eager={index < 2}
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
                  <ProjectLinks
                    project={project}
                    className="project-story__links"
                  />
                </div>
              </article>
            </div>
          ))}
        </div>

        <Link className="project-archive__back" href="/#work">
          <ArrowLeft aria-hidden="true" />
          Back to featured work
        </Link>
      </div>
    </section>
  );
}
