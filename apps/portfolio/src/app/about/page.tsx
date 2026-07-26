import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, Mail } from "lucide-react";

import { CertificateDeck } from "@/components/editorial/certificate-deck";
import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { sectionContent } = await getEditorialPortfolioData();
  return buildPublicPageMetadata({
    title: "About",
    description: sectionContent.about.description,
    pathname: "/about",
  });
}

export default async function AboutPage() {
  const portfolio = await getEditorialPortfolioData();
  const { about, sectionContent } = portfolio;
  const technologyGroups = portfolio.skillGroups.filter(
    (group) => group.items.length > 0,
  );

  return (
    <main className="editorial-page editorial-about-page">
      <EditorialSubpageHeader
        brandLabel={portfolio.profile.displayName}
        navigation={portfolio.navigation}
      />

      <section className="shell editorial-page-hero editorial-about-hero">
        <div>
          <h1>{about.headline}</h1>
          <p>{about.objective}</p>
        </div>
      </section>

      <section
        className="profile-section profile-section--about"
        aria-label="Background and profile facts"
      >
        <div className="shell">
          <div className="profile-grid">
            <div className="profile-story">
              <div className="profile-story__columns">
                {about.story.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="profile-actions">
                <a href="/api/resume" target="_blank" rel="noreferrer">
                  Résumé <FileText aria-hidden="true" />
                </a>
                <Link href="/contact">
                  Contact <Mail aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="profile-facts">
              {about.facts.map((fact) => (
                <article key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {sectionContent.skills.isVisible && technologyGroups.length > 0 ? (
        <section
          className="shell technology-stack"
          id="technology-stack"
          aria-labelledby="technology-stack-title"
        >
          <div className="section-heading">
            <span className="section-index">
              {sectionContent.skills.eyebrow}
            </span>
            <div>
              <h2 id="technology-stack-title">
                {sectionContent.skills.headline}
              </h2>
              <p>{sectionContent.skills.description}</p>
            </div>
          </div>

          <div className="technology-stack__groups">
            {technologyGroups.map((group, index) => (
              <article className="technology-stack__group" key={group.title}>
                <span className="technology-stack__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="technology-stack__copy">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
                <ul aria-label={`${group.title} technologies`}>
                  {group.items.map((technology) => (
                    <li key={technology.name}>{technology.name}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="experience-desk" id="experience">
        <div className="shell">
          <div className="section-heading">
            <span className="section-index">
              {sectionContent.experience.eyebrow}
            </span>
            <div>
              <h2>{sectionContent.experience.headline}</h2>
              <p>{sectionContent.experience.description}</p>
            </div>
          </div>

          <div className="experience-journey">
            {portfolio.experience.map((item) => (
              <div
                className="experience-stop"
                key={`${item.company}-${item.role}`}
              >
                <article>
                  <span className="experience-stop__period">{item.period}</span>
                  <div className="experience-stop__story">
                    <h3>{item.company}</h3>
                    <p className="experience-stop__role">
                      {item.role} · {item.location}
                    </p>
                    <p className="experience-stop__summary">{item.summary}</p>
                    <ul>
                      {item.outcomes.map((outcome) => (
                        <li key={outcome}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shell education-block" id="education">
        <div className="education-block__heading">
          <span className="section-index">
            {sectionContent.education.eyebrow}
          </span>
          <div>
            <h2>{sectionContent.education.headline}</h2>
            <p>{sectionContent.education.description}</p>
          </div>
        </div>

        <div className="education-journey">
          {portfolio.education.map((item) => (
            <div
              className="education-stop"
              key={`${item.school}-${item.period}`}
            >
              <article>
                <span className="education-stop__period">{item.period}</span>
                <div className="education-stop__story">
                  <h4>{item.school}</h4>
                  <p className="education-stop__degree">{item.degree}</p>
                  <p className="education-stop__meta">
                    {item.location} · <strong>{item.detail}</strong>
                  </p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      {portfolio.credentials.length > 0 ? (
        <section className="shell credential-list" id="credentials">
          <CertificateDeck
            credentials={portfolio.credentials}
            content={sectionContent.credentials}
          />
        </section>
      ) : null}

      <section className="shell home-contact-prompt">
        <div className="section-heading">
          <span className="section-index">Next</span>
          <div>
            <h2>See the systems I have built.</h2>
            <p>
              Move from the story behind the work into the products themselves.
            </p>
          </div>
        </div>
        <Link href="/work" className="text-link">
          Explore Work <ArrowUpRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
