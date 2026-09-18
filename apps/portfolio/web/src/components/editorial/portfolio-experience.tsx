import { getSectionLabel } from "@jayantgoyal/portfolio-contracts";
import { ArrowDown, ArrowUpRight, FileText, Mail } from "lucide-react";
import Link from "next/link";

import { CursorOrbit } from "@/components/editorial/cursor-orbit";
import { EditorialCtaBand } from "@/components/editorial/editorial-cta-band";
import { EditorialReveal } from "@/components/editorial/editorial-reveal";
import { GithubActivity } from "@/components/editorial/github-activity";
import { PortfolioNavigation } from "@/components/editorial/portfolio-navigation";
import { FeaturedWork } from "@/components/editorial/work-showcase";
import type {
  WritingPreview,
  PortfolioEditorialData,
  PortfolioSectionContent,
  PortfolioSectionKey,
} from "@/lib/portfolio/editorial-data";
import { getProductProofPoints } from "@/lib/portfolio/product-proof";
import { getCompactSectionHeading } from "@/lib/portfolio/section-heading";

function HeroHeadline({ headline }: { headline: string }) {
  const accentPhrase = "ambitious";
  const accentStart = headline.toLowerCase().indexOf(accentPhrase);

  if (accentStart === -1) return headline;

  const accentEnd = accentStart + accentPhrase.length;

  return (
    <>
      {headline.slice(0, accentStart)}
      <em>{headline.slice(accentStart, accentEnd)}</em>
      {headline.slice(accentEnd)}
    </>
  );
}

function ProductProofStrip({ content }: { content: PortfolioSectionContent }) {
  return (
    <section className="product-proof" aria-label="Product engineering proof">
      <div className="shell">
        <dl className="product-proof__grid">
          {getProductProofPoints(content).map((point) => (
            <div key={point.label}>
              <dt>{point.label}</dt>
              <dd>{point.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function WritingSection({
  writingPosts,
  content,
}: {
  writingPosts: WritingPreview[];
  content: PortfolioSectionContent;
}) {
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);
  const allArticlesLabel = content.accent || "All articles";
  const readArticleLabel = getSectionLabel(
    content.labels,
    "readCta",
    "Read article",
  );

  return (
    <section id="writing" className="writing-section">
      <div className="shell">
        <div className="writing-block">
          <div className="section-heading writing-block__heading">
            <span className="section-index">{heading.label}</span>
            <div>
              <h2>{heading.title}</h2>
              <div className="writing-block__heading-meta">
                <p>{content.description}</p>
                <Link href="/writing">
                  {allArticlesLabel} <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          <div className="writing-index">
            {writingPosts.length === 0 ? (
              <div className="editorial-writing-index__empty">
                <p>{content.supportingText || "No published notes yet."}</p>
              </div>
            ) : null}
            {writingPosts.map((post) => (
              <EditorialReveal key={post.slug} className="writing-entry">
                <div className="writing-entry__meta">
                  <span>{post.date}</span>
                  <span>Published note</span>
                </div>
                <div className="writing-entry__title">
                  <h3>
                    <Link href={`/writing/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <ul aria-label="Topics">
                    {post.tags.slice(0, 4).map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>
                <p className="writing-entry__excerpt">{post.excerpt}</p>
                <span className="writing-entry__action">
                  {readArticleLabel}{" "}
                  <ArrowUpRight aria-hidden="true" />
                </span>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPreview({
  about,
  content,
  workCta,
}: {
  about: PortfolioEditorialData["about"];
  content: PortfolioSectionContent;
  workCta: string;
}) {
  const heading = getCompactSectionHeading(content.eyebrow, about.headline);

  return (
    <section className="profile-section profile-section--preview">
      <div className="shell">
        <EditorialReveal className="section-heading">
          <span className="section-index">{heading.label}</span>
          <div>
            <h2>{heading.title}</h2>
            <p>{about.objective}</p>
          </div>
        </EditorialReveal>
        <div className="profile-grid">
          <EditorialReveal className="profile-story">
            <p className="profile-story__lead">{about.lead}</p>
            <Link href="/about" className="text-link">
              {workCta} <ArrowUpRight aria-hidden="true" />
            </Link>
          </EditorialReveal>
          <div className="profile-facts">
            {about.facts.slice(0, 3).map((fact) => (
              <EditorialReveal key={fact.label}>
                <article>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </article>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactPrompt({ content }: { content: PortfolioSectionContent }) {
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);

  return (
    <EditorialCtaBand
      id="contact"
      eyebrow={heading.label}
      title={heading.title}
      description={content.description}
      href="/contact"
      actionLabel={content.supportingText}
    />
  );
}

export function PortfolioExperience({
  writingPosts,
  data,
}: {
  writingPosts: WritingPreview[];
  data: PortfolioEditorialData;
}) {
  const { profile, about, work, navigation, sectionContent } = data;
  const visibleNavigation = navigation.filter((item) => {
    const content = sectionContent[item.key as PortfolioSectionKey];
    return content?.isVisible ?? true;
  });
  const heroFactLabels = [
    getSectionLabel(sectionContent.hero.labels, "factBuilding", "Building"),
    getSectionLabel(sectionContent.hero.labels, "factWorkingAs", "Working as"),
    getSectionLabel(sectionContent.hero.labels, "factBasedIn", "Based in"),
  ];
  const [buildingLabel, workingAsLabel, basedInLabel] = heroFactLabels;

  return (
    <main>
      <CursorOrbit />

      <header className="site-header">
        <div className="shell site-header__inner">
          <a className="monogram" href="#top" aria-label="Back to top">
            {profile.displayName}
          </a>
          <PortfolioNavigation
            surface="home"
            ariaLabel="Primary navigation"
            items={visibleNavigation}
            contact={sectionContent.contact}
          />
          {sectionContent.contact.isVisible ? (
            <Link className="header-contact" href="/contact">
              Start a conversation{" "}
              <ArrowDown aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      {sectionContent.hero.isVisible ? (
        <section id="top" className="hero">
          <div className="shell hero__grid">
            <div className="hero__type">
              <span className="section-index">
                {sectionContent.hero.eyebrow}
              </span>
              <h1>
                <HeroHeadline headline={profile.headline} />
              </h1>
              <p>{profile.introduction}</p>
              <div className="hero-actions">
                <Link href="/work" className="text-link" data-cursor="Explore">
                  {sectionContent.home.accent || "Explore Work"}{" "}
                  <ArrowDown aria-hidden="true" />
                </Link>
                <Link href="/resume" className="text-link">
                  {sectionContent.hero.accent ||
                    sectionContent.resume.eyebrow ||
                    "Resume"}{" "}
                  <FileText aria-hidden="true" />
                </Link>
                {sectionContent.contact.isVisible ? (
                  <Link href="/contact" className="text-link">
                    {sectionContent.contact.accent ||
                      sectionContent.contact.supportingText}{" "}
                    <Mail aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </div>

            <EditorialReveal className="hero-note">
              <span>{sectionContent.hero.supportingText}</span>
              <p>{profile.availability}</p>
              <dl>
                <div>
                  <dt>{buildingLabel}</dt>
                  <dd>{profile.focus}</dd>
                </div>
                <div>
                  <dt>{workingAsLabel}</dt>
                  <dd>{profile.currentRole}</dd>
                </div>
                <div>
                  <dt>{basedInLabel}</dt>
                  <dd>{profile.location}</dd>
                </div>
              </dl>
            </EditorialReveal>
          </div>
        </section>
      ) : (
        <div id="top" />
      )}

      <ProductProofStrip content={sectionContent.engineering} />

      {sectionContent.work.isVisible ? (
        <FeaturedWork work={work} content={sectionContent.work} />
      ) : null}
      {sectionContent.github_activity.isVisible ? (
        <GithubActivity
          profile={profile}
          content={sectionContent.github_activity}
        />
      ) : null}
      {sectionContent.writing.isVisible ? (
        <WritingSection
          writingPosts={writingPosts}
          content={sectionContent.writing}
        />
      ) : null}

      {sectionContent.about.isVisible ? (
        <AboutPreview
          about={about}
          content={sectionContent.about}
          workCta="About Jayant"
        />
      ) : null}
      {sectionContent.contact.isVisible ? (
        <ContactPrompt content={sectionContent.contact} />
      ) : null}
    </main>
  );
}
