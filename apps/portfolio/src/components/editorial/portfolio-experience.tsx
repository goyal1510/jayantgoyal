"use client";

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
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
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
} from "@/lib/portfolio/editorial-data";
import type { GitHubLOCStats } from "@/lib/github/types";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

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

function ProjectWall({ projects }: { projects: PortfolioProject[] }) {
  return (
    <section id="work" className="project-desk">
      <div className="shell">
        <Reveal className="section-heading section-heading--light">
          <span className="section-index">Selected work / Product systems</span>
          <div>
            <h2>Built for real days, real people, and real pressure.</h2>
            <p>
              A selection spanning developer tools, realtime collaboration,
              personal workflows, games, utilities, and commerce—designed and
              engineered from the first decision through delivery.
            </p>
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
                      <Image
                        src={project.image}
                        alt={project.imageAlt}
                        width={2940}
                        height={project.imageHeight}
                        quality={92}
                        loading={index < 2 ? "eager" : "lazy"}
                        sizes="(max-width: 760px) calc(100vw - 72px), (max-width: 1100px) 52vw, 56vw"
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
                    <a href={project.href} target="_blank" rel="noreferrer">
                      Live product <ArrowUpRight aria-hidden="true" />
                    </a>
                    <a href={project.github} target="_blank" rel="noreferrer">
                      Source <Github aria-hidden="true" />
                    </a>
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
}: {
  credentials: PortfolioCredential[];
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
        <span className="section-index">Credentials / Milestones</span>
        <div>
          <h3>A few milestones, kept in one deck.</h3>
          <p>
            Formal chapters from the learning and internships behind the work.
          </p>
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
            <Image
              src={activeCertificate.image}
              alt={activeCertificate.imageAlt}
              width={activeCertificate.imageWidth}
              height={activeCertificate.imageHeight}
              quality={92}
              sizes="(max-width: 760px) 84vw, 62vw"
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
}: {
  experience: PortfolioExperienceItem[];
  credentials: PortfolioCredential[];
}) {
  return (
    <section id="experience" className="experience-desk">
      <div className="shell">
        <Reveal className="section-heading section-heading--light">
          <span className="section-index">Career / The path so far</span>
          <div>
            <h2>Each role moved me closer to the whole product.</h2>
            <p>
              What began in enterprise engineering now spans product thinking,
              systems, interfaces, and the responsibility of shipping them
              together.
            </p>
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
            </Reveal>
          ))}
        </div>

        <CertificateDeck credentials={credentials} />
      </div>
    </section>
  );
}

function ActivitySection({
  githubStats,
  profile,
}: {
  githubStats: GitHubLOCStats | null;
  profile: PortfolioProfile;
}) {
  return (
    <section id="activity" className="activity-section">
      <div className="shell">
        <Reveal className="section-heading">
          <span className="section-index">Open source / GitHub</span>
          <div>
            <h2>The work between the launches.</h2>
            <p>
              A live view of the repositories, languages, and contribution
              rhythm behind the public work.
            </p>
          </div>
        </Reveal>

        <div className="github-paper">
          <div className="github-paper__topline">
            <div>
              <Github aria-hidden="true" />
              <span>github.com/goyal1510</span>
            </div>
            <a href={profile.github} target="_blank" rel="noreferrer">
              View profile <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <GithubContributions username="goyal1510" />
          <GithubCodeStats username="goyal1510" initialStats={githubStats} />
        </div>
      </div>
    </section>
  );
}

function WritingSection({ blogPosts }: { blogPosts: BlogPreview[] }) {
  return (
    <section id="writing" className="writing-section">
      <div className="shell">
        <div className="writing-block">
          <div className="writing-block__heading">
            <span className="section-index">
              Writing / Notes from the build
            </span>
            <Link href="/blog">
              All articles <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="writing-index">
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

function ContactSection({ profile }: { profile: PortfolioProfile }) {
  return (
    <footer id="contact" className="contact-section">
      <div className="shell">
        <div className="contact-section__grid">
          <Reveal className="contact-section__copy">
            <span className="section-index">
              Contact / Start a conversation
            </span>
            <h2>
              Have an idea with <em>sharp edges?</em>
            </h2>
            <p>
              Tell me what you are trying to make, where it feels difficult, and
              what a useful outcome would look like.
            </p>
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
              <p>I normally reply within one business day.</p>
            </div>
            <ContactForm />
          </Reveal>
        </div>

        <div className="contact-section__footer">
          <span>{profile.name} © 2026</span>
          <span>{profile.location}</span>
          <div>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <Github aria-hidden="true" />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin aria-hidden="true" />
            </a>
            <a
              href={profile.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <Instagram aria-hidden="true" />
            </a>
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
  } = data;
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
            {profile.monogram}
          </a>
          <PortfolioNavigation surface="home" ariaLabel="Primary navigation" />
          <a className="header-contact" href="#contact">
            Let&apos;s talk <ArrowDown aria-hidden="true" />
          </a>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="shell hero__grid">
          <motion.div className="hero__type" style={{ y: heroY }}>
            <span className="section-index">Portfolio / 2026</span>
            <h1>{profile.headline}</h1>
            <p>
              I&apos;m {profile.name}, a full-stack product engineer who turns
              ambitious, messy ideas into reliable experiences.
            </p>
            <a href="#work" className="text-link" data-cursor="Explore">
              See the project wall <ArrowDown aria-hidden="true" />
            </a>
          </motion.div>

          <Reveal className="hero-note" delay={0.12}>
            <span>Field note / Current</span>
            <p>{profile.availability}</p>
            <dl>
              <div>
                <dt>Building</dt>
                <dd>Healthcare product systems</dd>
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

      <section id="about" className="profile-section">
        <div className="shell">
          <Reveal className="section-heading">
            <span className="section-index">
              About / Product mind, engineering hands
            </span>
            <div>
              <h2>{about.headline}</h2>
              <p>{about.objective}</p>
            </div>
          </Reveal>

          <div className="profile-grid">
            <Reveal className="profile-story">
              <p className="profile-story__lead">
                I care about the path from the first product question to the
                final interaction detail.
              </p>
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

          <div className="education-block">
            <div className="education-block__heading">
              <span className="section-index">Education / Foundation</span>
              <h3>Where the foundation was built.</h3>
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
                      <p className="education-stop__degree">{item.degree}</p>
                      <p className="education-stop__meta">
                        {item.location} · <strong>{item.detail}</strong>
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className="capability-section">
        <div className="shell">
          <Reveal className="section-heading">
            <span className="section-index">
              Capabilities / Across the stack
            </span>
            <div>
              <h2>
                Broad enough to own the path. Focused enough to sweat the
                details.
              </h2>
              <p>
                The tools I use to shape interfaces, systems, data, and the
                space between them.
              </p>
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

      <ExperienceLandscape experience={experience} credentials={credentials} />
      <ActivitySection githubStats={githubStats} profile={profile} />
      <ProjectWall projects={projects} />
      <WritingSection blogPosts={blogPosts} />
      <ContactSection profile={profile} />
    </main>
  );
}
