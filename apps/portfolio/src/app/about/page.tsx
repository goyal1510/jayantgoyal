import type { Metadata } from "next";

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
  const about = portfolio.about;

  return (
    <main className="editorial-page editorial-work-page">
      <EditorialSubpageHeader
        brandLabel={portfolio.profile.displayName}
        navigation={portfolio.navigation}
      />
      <section className="shell editorial-page-hero editorial-work-hero">
        <span className="section-index">{portfolio.sectionContent.about.eyebrow}</span>
        <div>
          <h1>{about.headline}</h1>
          <p>{about.objective}</p>
        </div>
      </section>
      <section className="shell profile-section">
        <div className="profile-grid">
          <div className="profile-story">
            <p className="profile-story__lead">{about.lead}</p>
            {about.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
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
      </section>
      <section className="shell experience-desk" id="experience">
        <div className="section-heading section-heading--light">
          <span className="section-index">{portfolio.sectionContent.experience.eyebrow}</span>
          <div>
            <h2>{portfolio.sectionContent.experience.headline}</h2>
            <p>{portfolio.sectionContent.experience.description}</p>
          </div>
        </div>
        <div className="experience-journey">
          {portfolio.experience.map((item) => (
            <article className="experience-stop" key={`${item.company}-${item.role}`}>
              <span className="experience-stop__period">{item.period}</span>
              <div className="experience-stop__story">
                <h3>{item.company}</h3>
                <p className="experience-stop__role">{item.role} · {item.location}</p>
                <ul>
                  {item.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="shell education-block" id="education">
        <div className="education-block__heading">
          <span className="section-index">{portfolio.sectionContent.education.eyebrow}</span>
          <div>
            <h2>{portfolio.sectionContent.education.headline}</h2>
            <p>{portfolio.sectionContent.education.description}</p>
          </div>
        </div>
        <div className="education-journey">
          {portfolio.education.map((item) => (
            <article className="education-stop" key={`${item.school}-${item.period}`}>
              <span className="education-stop__period">{item.period}</span>
              <div className="education-stop__story">
                <h3>{item.school}</h3>
                <p className="education-stop__degree">{item.degree}</p>
                <p className="education-stop__meta">
                  {item.location} · <strong>{item.detail}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      {portfolio.credentials.length > 0 ? (
        <section className="shell credential-list" id="credentials">
          <div className="section-heading">
            <span className="section-index">{portfolio.sectionContent.credentials.eyebrow}</span>
            <div>
              <h2>{portfolio.sectionContent.credentials.headline}</h2>
              <p>{portfolio.sectionContent.credentials.description}</p>
            </div>
          </div>
          <div className="credential-list__grid">
            {portfolio.credentials.map((credential) => (
              <a
                key={credential.name}
                href={credential.href}
                target="_blank"
                rel="noreferrer"
              >
                <span>{credential.category}</span>
                <strong>{credential.name}</strong>
                <small>{credential.issuer}</small>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
