'use client';

import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";
import { HeroSection } from "@/components/portfolio/sections/hero-section";
import { AboutSection } from "@/components/portfolio/sections/about-section";
import { SkillsSection } from "@/components/portfolio/sections/skills-section";
import type { Project } from "@/components/portfolio/shared";

// Lazy-load below-fold sections — not needed for first paint
const ExperienceSection = lazy(() => import("@/components/portfolio/sections/experience-section").then((m) => ({ default: m.ExperienceSection })));
const ProjectsSection = lazy(() => import("@/components/portfolio/sections/projects-section").then((m) => ({ default: m.ProjectsSection })));
const ProjectModal = lazy(() => import("@/components/portfolio/sections/projects-section").then((m) => ({ default: m.ProjectModal })));
const CertificatesSection = lazy(() => import("@/components/portfolio/sections/certificates-section").then((m) => ({ default: m.CertificatesSection })));
const GithubActivitySection = lazy(() => import("@/components/portfolio/sections/github-activity-section").then((m) => ({ default: m.GithubActivitySection })));
const ContactSection = lazy(() => import("@/components/portfolio/sections/contact-section").then((m) => ({ default: m.ContactSection })));
const CodeStatsSection = lazy(() => import("@/components/portfolio/code-stats-section").then((m) => ({ default: m.CodeStatsSection })));

export default function PortfolioClient() {
  const { data, source } = usePortfolioData();
  const {
    HERO,
    ABOUT,
    EDUCATION,
    EXPERIENCE,
    SKILL_SETS,
    TECH_ICONS,
    PROJECTS,
    CERTIFICATES,
    CONTACT,
  } = data;

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    CERTIFICATES.forEach((cert) => set.add(cert.category));
    return Array.from(set);
  }, [CERTIFICATES]);

  const githubSocial = CONTACT.socials.find((social) => social.label === "GitHub");
  const githubUrl = githubSocial?.href;
  const githubUsername = githubUrl?.match(/github\.com\/([^/]+)/)?.[1] || "goyal1510";

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const timeout = setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [data]);

  return (
    <>
      <div className="relative z-10 space-y-16">
        {/* Above-fold: loaded immediately for fast LCP */}
        <HeroSection hero={HERO} source={source} />
        <AboutSection about={ABOUT} education={EDUCATION} />
        <SkillsSection skillSets={SKILL_SETS} techIcons={TECH_ICONS} />

        {/* Below-fold: lazy-loaded, only renders when scrolled into view */}
        <Suspense>
          <CodeStatsSection githubUsername={githubUsername} />
          <GithubActivitySection githubUsername={githubUsername} githubUrl={githubUrl} />
          <ExperienceSection experience={EXPERIENCE} />
          <ProjectsSection
            projects={PROJECTS}
            onSelectProject={setSelectedProject}
          />
          <CertificatesSection
            categories={categories}
            selectedCategory={selectedCategory}
            certificates={CERTIFICATES}
            onSelectCategory={setSelectedCategory}
          />
          <ContactSection contact={CONTACT} />
        </Suspense>
        {selectedProject ? (
          <Suspense>
            <ProjectModal
              project={selectedProject}
              onClose={() => setSelectedProject(null)}
            />
          </Suspense>
        ) : null}
      </div>
    </>
  );
}
