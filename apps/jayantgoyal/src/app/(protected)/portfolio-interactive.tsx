'use client';

import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";
import { SkillsSection } from "@/components/portfolio/sections/skills-section";
import type { Project } from "@/components/portfolio/shared";

const ExperienceSection = lazy(() => import("@/components/portfolio/sections/experience-section").then((m) => ({ default: m.ExperienceSection })));
const ProjectsSection = lazy(() => import("@/components/portfolio/sections/projects-section").then((m) => ({ default: m.ProjectsSection })));
const ProjectModal = lazy(() => import("@/components/portfolio/sections/projects-section").then((m) => ({ default: m.ProjectModal })));
const CertificatesSection = lazy(() => import("@/components/portfolio/sections/certificates-section").then((m) => ({ default: m.CertificatesSection })));
const GithubActivitySection = lazy(() => import("@/components/portfolio/sections/github-activity-section").then((m) => ({ default: m.GithubActivitySection })));
const ContactSection = lazy(() => import("@/components/portfolio/sections/contact-section").then((m) => ({ default: m.ContactSection })));
const CodeStatsSection = lazy(() => import("@/components/portfolio/code-stats-section").then((m) => ({ default: m.CodeStatsSection })));

export function PortfolioInteractive() {
  const { data } = usePortfolioData();
  const { EXPERIENCE, SKILL_SETS, TECH_ICONS, PROJECTS, CERTIFICATES, CONTACT } = data;

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
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <>
      <SkillsSection skillSets={SKILL_SETS} techIcons={TECH_ICONS} />
      <Suspense>
        <CodeStatsSection githubUsername={githubUsername} />
        <GithubActivitySection githubUsername={githubUsername} githubUrl={githubUrl} />
        <ExperienceSection experience={EXPERIENCE} />
        <ProjectsSection projects={PROJECTS} onSelectProject={setSelectedProject} />
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
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </Suspense>
      ) : null}
    </>
  );
}
