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
import type {
  BlogPreview,
  PortfolioCredential,
  PortfolioEditorialData,
  PortfolioExperience as PortfolioExperienceItem,
  PortfolioProfile,
  PortfolioProject,
  PortfolioSectionContent,
  PortfolioSectionKey,
  PortfolioSocialLink,
} from "@/lib/portfolio/editorial-data";
import type { GitHubLOCStats } from "@/lib/github/types";

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

function ProjectWall({
  projects,
  content,
}: {
  projects: PortfolioProject[];
  content: PortfolioSectionContent;
}) {
  return (
    <section id="work" className="project-desk">
      <div className="shell">
        <Reveal className="section-heading section-heading--light">
          <span className="section-index">{content.eyebrow}</span>
          <div>
            <h2>{content.headline}</h2>
            <p>{content.description}</p>
          </div>
        </Reveal>

        <div className="project-stories">
          {projects.map((project, index) => (
            <Reveal
              key={project.id}
              className={`project-story project-story--${project.tone}`}
              delay={(index % 2) * 0.05}
              animate={false}
            >
              <article>
                <div className="project-fragment">
                  <div className="torn-sheet">
                    <div className="torn-sheet__image">
                      <img
                        src={project.image}
                        alt={project.imageAlt}
                        loading={index < 2 ? "eager" : "lazy"}
                      />
                    </div>
                  </div>
                </div>
                <div className="project-story__copy">
                  <div className="project-story__meta">
                    <span>{project.eyebrow}</span>
                    <span>{project.year}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p className="project-story__summary">{project.summary}</p>
                  <p className="project-story__impact">{project.impact}</p>
                  <ul aria-label="Technologies">
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <p className="project-story__role">{project.role}</p>
                  <div className="project-story__links">
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
              </article>
            </Reveal>
          ))}
        </div>
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
        <span className="section-index">{content.eyebrow}</span>
        <div>
          <h3>{content.headline}</h3>
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
  return (
    <section id="experience" className="experience-desk">
      <div className="shell">
        {content.isVisible ? (
          <>
            <Reveal className="section-heading section-heading--light">
              <span className="section-index">{content.eyebrow}</span>
              <div>
                <h2>{content.headline}</h2>
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
                      <p className="experience-stop__summary">{item.summary}</p>
                      <ul>
                        {item.outcomes.map((outcome) => (
                          <li key={outcome}>{outcome}</li>
                        ))}
                      </ul>
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

function ActivitySection({
  githubStats,
  profile,
  content,
}: {
  githubStats: GitHubLOCStats | null;
  profile: PortfolioProfile;
  content: PortfolioSectionContent;
}) {
  return (
    <section id="activity" className="activity-section">
      <div className="shell">
        <Reveal className="section-heading">
          <span className="section-index">{content.eyebrow}</span>
          <div>
            <h2>{content.headline}</h2>
            <p>{content.description}</p>
          </div>
        </Reveal>

        <div className="github-paper">
          <div className="github-paper__topline">
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
  blogPosts,
  content,
}: {
  blogPosts: BlogPreview[];
  content: PortfolioSectionContent;
}) {
  return (
    <section id="writing" className="writing-section">
      <div className="shell">
        <div className="writing-block">
          <div className="writing-block__heading">
            <span className="section-index">{content.eyebrow}</span>
            <Link href="/blog">
              All articles <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="writing-index">
            {blogPosts.length === 0 ? (
              <div className="editorial-writing-index__empty">
                <p>No published notes yet.</p>
              </div>
            ) : null}
            {blogPosts.map((post, index) => (
              <Reveal
                key={post.slug}
                className="writing-entry"
                delay={index * 0.06}
              >
                <Link
                  className="writing-entry__link"
                  href={`/blog/${post.slug}`}
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

function ContactSection({
  profile,
  content,
}: {
  profile: PortfolioProfile;
  content: PortfolioSectionContent;
}) {
  return (
    <footer id="contact" className="contact-section">
      <div className="shell">
        <div className="contact-section__grid">
          <Reveal className="contact-section__copy">
            <span className="section-index">{content.eyebrow}</span>
            <h2>
              {content.headline} <em>{content.accent}</em>
            </h2>
            <p>{content.description}</p>
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
  blogPosts,
  data,
}: {
  githubStats: GitHubLOCStats | null;
  blogPosts: BlogPreview[];
  data: PortfolioEditorialData;
}) {
  const {
    profile,
    about,
    education,
    experience,
    skillGroups,
    projects,
    credentials,
    principles,
    navigation,
    sectionContent,
  } = data;
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
            <a className="header-contact" href="#contact">
              Let&apos;s talk <ArrowDown aria-hidden="true" />
            </a>
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
              <h1>{profile.headline}</h1>
              <p>{profile.introduction}</p>
              {sectionContent.work.isVisible ? (
                <a href="#work" className="text-link" data-cursor="Explore">
                  See the project wall <ArrowDown aria-hidden="true" />
                </a>
              ) : null}
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

      {sectionContent.about.isVisible || sectionContent.education.isVisible ? (
        <section id="about" className="profile-section">
          <div className="shell">
            {sectionContent.about.isVisible ? (
              <>
                <Reveal className="section-heading">
                  <span className="section-index">
                    {sectionContent.about.eyebrow}
                  </span>
                  <div>
                    <h2>{about.headline}</h2>
                    <p>{about.objective}</p>
                  </div>
                </Reveal>

                <div className="profile-grid">
                  <Reveal className="profile-story">
                    <p className="profile-story__lead">{about.lead}</p>
                    <div className="profile-story__columns">
                      {about.story.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
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
                    {sectionContent.education.eyebrow}
                  </span>
                  <h3>{sectionContent.education.headline}</h3>
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

      {sectionContent.skills.isVisible ? (
        <section id="skills" className="capability-section">
          <div className="shell">
            <Reveal className="section-heading">
              <span className="section-index">
                {sectionContent.skills.eyebrow}
              </span>
              <div>
                <h2>{sectionContent.skills.headline}</h2>
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

      {sectionContent.experience.isVisible ||
      sectionContent.credentials.isVisible ? (
        <ExperienceLandscape
          experience={experience}
          credentials={credentials}
          content={sectionContent.experience}
          credentialContent={sectionContent.credentials}
        />
      ) : null}
      {sectionContent.activity.isVisible ? (
        <ActivitySection
          githubStats={githubStats}
          profile={profile}
          content={sectionContent.activity}
        />
      ) : null}
      {sectionContent.work.isVisible ? (
        <ProjectWall projects={projects} content={sectionContent.work} />
      ) : null}
      {sectionContent.writing.isVisible ? (
        <WritingSection
          blogPosts={blogPosts}
          content={sectionContent.writing}
        />
      ) : null}
      {sectionContent.contact.isVisible ? (
        <ContactSection profile={profile} content={sectionContent.contact} />
      ) : null}
    </main>
  );
}
