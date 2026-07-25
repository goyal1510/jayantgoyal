"use client";

/* eslint-disable @next/next/no-img-element */

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Facebook,
  Globe2,
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ContactForm } from "@/components/editorial/contact-form";
import { GithubCodeStats } from "@/components/editorial/github-code-stats";
import { GithubContributions } from "@/components/editorial/github-contributions";
import { PortfolioNavigation } from "@/components/editorial/portfolio-navigation";
import { FeaturedWork } from "@/components/editorial/work-showcase";
import type {
  WritingPreview,
  PortfolioCredential,
  PortfolioEditorialData,
  PortfolioExperience as PortfolioExperienceItem,
  PortfolioProfile,
  PortfolioSectionContent,
  PortfolioSectionKey,
  PortfolioSocialLink,
} from "@/lib/portfolio/editorial-data";
import { PRODUCT_PROOF_POINTS } from "@/lib/portfolio/product-proof";
import { getCompactSectionHeading } from "@/lib/portfolio/section-heading";
import type { GitHubLOCStats } from "@repo/github";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const SOCIAL_ICON_MAP: Record<string, LucideIcon> = {
  facebook: Facebook,
  github: Github,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
};

function SocialIcon({ social }: { social: PortfolioSocialLink }) {
  const identity = `${social.iconKey} ${social.label}`.toLowerCase();
  const key = Object.keys(SOCIAL_ICON_MAP).find((candidate) =>
    identity.includes(candidate),
  );
  const Icon = key ? SOCIAL_ICON_MAP[key] : Globe2;
  return Icon ? <Icon aria-hidden="true" /> : null;
}

function Reveal({
  children,
  className,
  delay = 0,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animate?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reveal}
      initial={reduceMotion || !animate ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduceMotion ? 0 : 0.68,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

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

function ProductProofStrip() {
  return (
    <section className="product-proof" aria-label="Product engineering proof">
      <div className="shell">
        <dl className="product-proof__grid">
          {PRODUCT_PROOF_POINTS.map((point) => (
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

function CertificateDeck({
  credentials,
  content,
}: {
  credentials: PortfolioCredential[];
  content: PortfolioSectionContent;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCertificate = credentials[activeIndex] ?? credentials[0];
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);

  if (!activeCertificate) return null;

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? credentials.length - 1 : current - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % credentials.length);
  }

  return (
    <div className="credential-gallery">
      <div className="credential-gallery__heading">
        <span className="section-index">{heading.label}</span>
        <div>
          <h3>{heading.title}</h3>
          <p>{content.description}</p>
        </div>
      </div>

      <div className="certificate-deck">
        <div className="certificate-deck__stage">
          <span className="certificate-deck__back certificate-deck__back--left" />
          <span className="certificate-deck__back certificate-deck__back--right" />
          <a
            className="certificate-deck__active"
            href={activeCertificate.href}
            target="_blank"
            rel="noreferrer"
            key={activeCertificate.name}
          >
            <img
              src={activeCertificate.image}
              alt={activeCertificate.imageAlt}
            />
          </a>
        </div>

        <div className="certificate-deck__controls">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous certificate"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <div aria-live="polite">
            <span>
              {activeCertificate.category} · {activeCertificate.issuer}
            </span>
            <strong>{activeCertificate.name}</strong>
            {activeCertificate.description ? (
              <p className="certificate-deck__description">
                {activeCertificate.description}
              </p>
            ) : null}
            {activeCertificate.issuedAt || activeCertificate.credentialId ? (
              <div className="certificate-deck__metadata">
                {activeCertificate.issuedAt ? (
                  <span>Issued {activeCertificate.issuedAt}</span>
                ) : null}
                {activeCertificate.credentialId ? (
                  <span>ID {activeCertificate.credentialId}</span>
                ) : null}
              </div>
            ) : null}
            {activeCertificate.credentialUrl ? (
              <a
                className="certificate-deck__verify"
                href={activeCertificate.credentialUrl}
                target="_blank"
                rel="noreferrer"
              >
                Verify credential <ArrowUpRight aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next certificate"
          >
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExperienceLandscape({
  experience,
  credentials,
  content,
  credentialContent,
}: {
  experience: PortfolioExperienceItem[];
  credentials: PortfolioCredential[];
  content: PortfolioSectionContent;
  credentialContent: PortfolioSectionContent;
}) {
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);

  return (
    <section id="experience" className="experience-desk">
      <div className="shell">
        {content.isVisible ? (
          <>
            <Reveal className="section-heading section-heading--light">
              <span className="section-index">{heading.label}</span>
              <div>
                <h2>{heading.title}</h2>
                <p>{content.description}</p>
              </div>
            </Reveal>

            <div className="experience-journey">
              {experience.map((item, index) => (
                <Reveal
                  key={`${item.company}-${item.role}`}
                  className="experience-stop"
                  delay={index * 0.05}
                >
                  <article>
                    <span className="experience-stop__period">
                      {item.period}
                    </span>
                    <div className="experience-stop__story">
                      <h3>{item.company}</h3>
                      <p className="experience-stop__role">
                        {item.role} · {item.location}
                      </p>
                      {item.outcomes.length > 0 ? (
                        <ul>
                          {item.outcomes.slice(0, 2).map((outcome) => (
                            <li key={outcome}>{outcome}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="experience-stop__summary">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </>
        ) : null}

        {credentialContent.isVisible && credentials.length > 0 ? (
          <CertificateDeck
            credentials={credentials}
            content={credentialContent}
          />
        ) : null}
      </div>
    </section>
  );
}

function GithubSection({
  githubStats,
  profile,
  content,
}: {
  githubStats: GitHubLOCStats | null;
  profile: PortfolioProfile;
  content: PortfolioSectionContent;
}) {
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);

  return (
    <section id="activity" className="activity-section">
      <div className="shell">
        <Reveal className="section-heading">
          <span className="section-index">{heading.label}</span>
          <div>
            <h2>{heading.title}</h2>
            <p>{content.description}</p>
          </div>
        </Reveal>

        <div className="activity-paper">
          <div className="activity-paper__topline">
            <div>
              <Github aria-hidden="true" />
              <span>{profile.github.replace(/^https?:\/\//, "")}</span>
            </div>
            <a href={profile.github} target="_blank" rel="noreferrer">
              View profile <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <GithubContributions username={profile.githubUsername} />
          <GithubCodeStats
            username={profile.githubUsername}
            initialStats={githubStats}
          />
        </div>
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
                  All articles <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          <div className="writing-index">
            {writingPosts.length === 0 ? (
              <div className="editorial-writing-index__empty">
                <p>No published notes yet.</p>
              </div>
            ) : null}
            {writingPosts.map((post, index) => (
              <Reveal
                key={post.slug}
                className="writing-entry"
                delay={index * 0.06}
              >
                <Link
                  className="writing-entry__link"
                  href={`/writing/${post.slug}`}
                >
                  <div className="writing-entry__meta">
                    <span>{post.date}</span>
                    <span>Published note</span>
                  </div>
                  <div className="writing-entry__title">
                    <h3>{post.title}</h3>
                    <ul aria-label="Topics">
                      {post.tags.slice(0, 4).map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="writing-entry__excerpt">{post.excerpt}</p>
                  <span className="writing-entry__action">
                    Read article <ArrowUpRight aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
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
}: {
  about: PortfolioEditorialData["about"];
  content: PortfolioSectionContent;
}) {
  const heading = getCompactSectionHeading(content.eyebrow, about.headline);

  return (
    <section className="profile-section profile-section--preview">
      <div className="shell">
        <Reveal className="section-heading">
          <span className="section-index">{heading.label}</span>
          <div>
            <h2>{heading.title}</h2>
            <p>{about.objective}</p>
          </div>
        </Reveal>
        <div className="profile-grid">
          <Reveal className="profile-story">
            <p className="profile-story__lead">{about.lead}</p>
            <Link href="/about" className="text-link">
              About, experience, and education <ArrowUpRight aria-hidden="true" />
            </Link>
          </Reveal>
          <div className="profile-facts">
            {about.facts.slice(0, 3).map((fact, index) => (
              <Reveal key={fact.label} delay={index * 0.04}>
                <article>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactPrompt() {
  return (
    <section className="shell home-contact-prompt">
      <div className="section-heading">
        <span className="section-index">Contact</span>
        <div>
          <h2>Have a product worth making real?</h2>
          <p>Share the brief, the current stage, and the outcome you need.</p>
        </div>
      </div>
      <Link href="/contact" className="text-link">
        Start a product conversation <ArrowUpRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function ContactSection({
  profile,
  content,
}: {
  profile: PortfolioProfile;
  content: PortfolioSectionContent;
}) {
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);

  return (
    <footer id="contact" className="contact-section">
      <div className="shell">
        <Reveal className="section-heading section-heading--contact">
          <span className="section-index">{heading.label}</span>
          <div>
            <h2>{heading.title}</h2>
            <p>{content.description}</p>
          </div>
        </Reveal>

        <div className="contact-section__grid">
          <Reveal className="contact-section__copy">
            <div className="contact-details">
              <a href={`mailto:${profile.email}`}>
                <Mail aria-hidden="true" />
                <span>
                  <small>Email</small>
                  {profile.email}
                </span>
              </a>
              <a href={`tel:${profile.phone.replaceAll(" ", "")}`}>
                <Phone aria-hidden="true" />
                <span>
                  <small>Phone</small>
                  {profile.phone}
                </span>
              </a>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(profile.location)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin aria-hidden="true" />
                <span>
                  <small>Location</small>
                  {profile.location}
                </span>
              </a>
            </div>
          </Reveal>

          <Reveal className="contact-form-paper" delay={0.08}>
            <div className="contact-form-paper__heading">
              <span>New message</span>
              <p>{content.supportingText}</p>
            </div>
            <ContactForm />
          </Reveal>
        </div>

        <div className="contact-section__footer">
          <span>
            {profile.name} © {new Date().getFullYear()}
          </span>
          <span>{profile.location}</span>
          <div>
            {profile.socials.map((social) => (
              <a
                key={`${social.label}-${social.href}`}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
              >
                <SocialIcon social={social} />
              </a>
            ))}
            <a href={`mailto:${profile.email}`} aria-label="Email">
              <Mail aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PortfolioExperience({
  githubStats,
  writingPosts,
  data,
}: {
  githubStats: GitHubLOCStats | null;
  writingPosts: WritingPreview[];
  data: PortfolioEditorialData;
}) {
  const {
    profile,
    about,
    education,
    experience,
    skillGroups,
    work,
    credentials,
    principles,
    navigation,
    sectionContent,
  } = data;
  const showLegacyHomeSections =
    process.env.NEXT_PUBLIC_SHOW_LEGACY_HOME_SECTIONS === "true";
  const visibleNavigation = navigation.filter((item) => {
    const content = sectionContent[item.key as PortfolioSectionKey];
    return content?.isVisible ?? true;
  });
  const [cursorLabel, setCursorLabel] = useState("");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.2,
  });
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -54]);
  const aboutHeading = getCompactSectionHeading(
    sectionContent.about.eyebrow,
    about.headline,
  );
  const educationHeading = getCompactSectionHeading(
    sectionContent.education.eyebrow,
    sectionContent.education.headline,
  );
  const skillsHeading = getCompactSectionHeading(
    sectionContent.skills.eyebrow,
    sectionContent.skills.headline,
  );

  useEffect(() => {
    const root = document.documentElement;
    const updatePointer = (event: PointerEvent) => {
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
    };
    const updateCursorLabel = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setCursorLabel(
        target.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "",
      );
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("pointerover", updateCursorLabel, {
      passive: true,
    });
    return () => {
      window.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("pointerover", updateCursorLabel);
    };
  }, []);

  return (
    <main>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <div
        className={`cursor-orbit${cursorLabel ? " cursor-orbit--active" : ""}`}
      >
        <span>{cursorLabel}</span>
      </div>

      <header className="site-header">
        <div className="shell site-header__inner">
          <a className="monogram" href="#top" aria-label="Back to top">
            {profile.displayName}
          </a>
          <PortfolioNavigation
            surface="home"
            ariaLabel="Primary navigation"
            items={visibleNavigation}
          />
          {sectionContent.contact.isVisible ? (
            <Link className="header-contact" href="/contact">
              Let&apos;s talk <ArrowDown aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      {sectionContent.hero.isVisible ? (
        <section id="top" className="hero">
          <div className="shell hero__grid">
            <motion.div className="hero__type" style={{ y: heroY }}>
              <span className="section-index">
                {sectionContent.hero.eyebrow}
              </span>
              <h1>
                <HeroHeadline headline={profile.headline} />
              </h1>
              <p>{profile.introduction}</p>
              <div className="hero-actions">
                <Link href="/work" className="text-link" data-cursor="Explore">
                  Explore Work <ArrowDown aria-hidden="true" />
                </Link>
                <Link href="/resume" className="text-link">
                  Résumé <FileText aria-hidden="true" />
                </Link>
                {sectionContent.contact.isVisible ? (
                  <Link href="/contact" className="text-link">
                    Discuss a product <Mail aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </motion.div>

            <Reveal className="hero-note" delay={0.12}>
              <span>{sectionContent.hero.supportingText}</span>
              <p>{profile.availability}</p>
              <dl>
                <div>
                  <dt>Building</dt>
                  <dd>{profile.focus}</dd>
                </div>
                <div>
                  <dt>Working as</dt>
                  <dd>{profile.currentRole}</dd>
                </div>
                <div>
                  <dt>Based in</dt>
                  <dd>{profile.location}</dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </section>
      ) : (
        <div id="top" />
      )}

      <ProductProofStrip />

      {sectionContent.work.isVisible ? (
        <FeaturedWork work={work} content={sectionContent.work} />
      ) : null}
      {sectionContent.writing.isVisible ? (
        <WritingSection
          writingPosts={writingPosts}
          content={sectionContent.writing}
        />
      ) : null}

      {showLegacyHomeSections &&
      (sectionContent.about.isVisible || sectionContent.education.isVisible) ? (
        <section id="about" className="profile-section">
          <div className="shell">
            {sectionContent.about.isVisible ? (
              <>
                <Reveal className="section-heading">
                  <span className="section-index">{aboutHeading.label}</span>
                  <div>
                    <h2>{aboutHeading.title}</h2>
                    <p>{about.objective}</p>
                  </div>
                </Reveal>

                <div className="profile-grid">
                  <Reveal className="profile-story">
                    <p className="profile-story__lead">{about.lead}</p>
                    <div className="profile-actions">
                      <a href={profile.resume} target="_blank" rel="noreferrer">
                        Résumé <FileText aria-hidden="true" />
                      </a>
                      <a href="#contact">
                        Contact <Mail aria-hidden="true" />
                      </a>
                    </div>
                  </Reveal>

                  <div className="profile-facts">
                    {about.facts.map((fact, index) => (
                      <Reveal key={fact.label} delay={index * 0.04}>
                        <article>
                          <span>{fact.label}</span>
                          <strong>{fact.value}</strong>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {sectionContent.education.isVisible ? (
              <div className="education-block">
                <div className="education-block__heading">
                  <span className="section-index">
                    {educationHeading.label}
                  </span>
                  <h3>{educationHeading.title}</h3>
                </div>
                <div className="education-journey">
                  {education.map((item, index) => (
                    <Reveal
                      key={`${item.school}-${item.period}`}
                      className="education-stop"
                      delay={index * 0.05}
                    >
                      <article>
                        <span className="education-stop__period">
                          {item.period}
                        </span>
                        <div className="education-stop__story">
                          <h4>{item.school}</h4>
                          <p className="education-stop__degree">
                            {item.degree}
                          </p>
                          <p className="education-stop__meta">
                            {item.location} · <strong>{item.detail}</strong>
                          </p>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {showLegacyHomeSections && sectionContent.skills.isVisible ? (
        <section id="engineering" className="capability-section">
          <div className="shell">
            <Reveal className="section-heading">
              <span className="section-index">{skillsHeading.label}</span>
              <div>
                <h2>{skillsHeading.title}</h2>
                <p>{sectionContent.skills.description}</p>
              </div>
            </Reveal>

            <div className="capability-matrix" aria-label="Capability index">
              <div className="capability-matrix__labels" aria-hidden="true">
                <span>Practice</span>
                <span>What it covers</span>
                <span>Working set</span>
              </div>
              {skillGroups.map((group, index) => (
                <Reveal
                  key={group.title}
                  className="capability-row"
                  delay={index * 0.04}
                >
                  <article>
                    <div className="capability-row__title">
                      <span aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{group.title}</h3>
                    </div>
                    <p className="skill-group__description">
                      {group.description}
                    </p>
                    <ul>
                      {group.items.map((item) => (
                        <li
                          key={item.name}
                          title={item.evidence}
                          data-proficiency={item.proficiency}
                        >
                          {item.name}
                          {item.proficiency ? (
                            <small>{item.proficiency}</small>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>

            <div className="principles-strip">
              {principles.map((principle) => (
                <article key={principle.title}>
                  <h3>{principle.title}</h3>
                  <p>{principle.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showLegacyHomeSections && (sectionContent.experience.isVisible ||
      sectionContent.credentials.isVisible) ? (
        <ExperienceLandscape
          experience={experience}
          credentials={credentials}
          content={sectionContent.experience}
          credentialContent={sectionContent.credentials}
        />
      ) : null}
      {showLegacyHomeSections && sectionContent.activity.isVisible ? (
        <GithubSection
          githubStats={githubStats}
          profile={profile}
          content={sectionContent.activity}
        />
      ) : null}
      {showLegacyHomeSections && sectionContent.contact.isVisible ? (
        <ContactSection profile={profile} content={sectionContent.contact} />
      ) : null}
      {sectionContent.about.isVisible ? (
        <AboutPreview about={about} content={sectionContent.about} />
      ) : null}
      {sectionContent.contact.isVisible ? <ContactPrompt /> : null}
    </main>
  );
}
