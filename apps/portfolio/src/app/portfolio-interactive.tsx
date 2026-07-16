"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { SkillsSection } from "@/components/portfolio/sections/skills-section";
import type { Project } from "@/components/portfolio/shared";
import type { GitHubLOCStats } from "@/lib/github-stats/types";
import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";

const ExperienceSection = lazy(() =>
  import("@/components/portfolio/sections/experience-section").then(
    (module) => ({ default: module.ExperienceSection }),
  ),
);
const ProjectsSection = lazy(() =>
  import("@/components/portfolio/sections/projects-section").then((module) => ({
    default: module.ProjectsSection,
  })),
);
const ProjectModal = lazy(() =>
  import("@/components/portfolio/sections/projects-section").then((module) => ({
    default: module.ProjectModal,
  })),
);
const CertificatesSection = lazy(() =>
  import("@/components/portfolio/sections/certificates-section").then(
    (module) => ({ default: module.CertificatesSection }),
  ),
);
const GithubActivitySection = lazy(() =>
  import("@/components/portfolio/sections/github-activity-section").then(
    (module) => ({ default: module.GithubActivitySection }),
  ),
);
const ContactSection = lazy(() =>
  import("@/components/portfolio/sections/contact-section").then((module) => ({
    default: module.ContactSection,
  })),
);
const CodeStatsSection = lazy(() =>
  import("@/components/portfolio/code-stats-section").then((module) => ({
    default: module.CodeStatsSection,
  })),
);

export function PortfolioInteractive({
  codeStats,
}: {
  codeStats: GitHubLOCStats | null;
}) {
  const { data } = usePortfolioData();
  const {
    EXPERIENCE,
    SKILL_SETS,
    TECH_ICONS,
    PROJECTS,
    CERTIFICATES,
    CONTACT,
  } = data;
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = useMemo(() => {
    const values = new Set<string>(["All"]);
    CERTIFICATES.forEach((certificate) => values.add(certificate.category));
    return Array.from(values);
  }, [CERTIFICATES]);
  const githubUrl = CONTACT.socials.find(
    (social) => social.label === "GitHub",
  )?.href;
  const githubUsername =
    githubUrl?.match(/github\.com\/([^/]+)/)?.[1] ?? "goyal1510";

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    let attempts = 0;
    const interval = window.setInterval(() => {
      const target = document.getElementById(hash);
      if (target) {
        window.clearInterval(interval);
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "instant" });
      } else if (++attempts >= 30) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <SkillsSection skillSets={SKILL_SETS} techIcons={TECH_ICONS} />
      <Suspense>
        <CodeStatsSection
          githubUsername={githubUsername}
          initialData={codeStats}
        />
        <GithubActivitySection
          githubUsername={githubUsername}
          githubUrl={githubUrl}
        />
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
    </>
  );
}
