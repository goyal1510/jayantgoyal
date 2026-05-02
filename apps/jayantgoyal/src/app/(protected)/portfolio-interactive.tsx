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
    if (!hash) return;

    // Sections use contentVisibility:"auto" with placeholder sizes.
    // First scroll triggers rendering of skipped sections, shifting layout.
    // We scroll multiple times to converge on the correct position.
    let attempts = 0;
    const interval = setInterval(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: attempts === 0 ? "instant" : "smooth" });
        attempts++;
        // After 3 scrolls (instant → smooth → smooth), layout should be stable
        if (attempts >= 3) clearInterval(interval);
      } else if (++attempts >= 30) {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <SkillsSection skillSets={SKILL_SETS} techIcons={TECH_ICONS} />
      <Suspense>
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "0 500px" }}>
          <CodeStatsSection githubUsername={githubUsername} />
        </div>
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "0 400px" }}>
          <GithubActivitySection githubUsername={githubUsername} githubUrl={githubUrl} />
        </div>
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "0 600px" }}>
          <ExperienceSection experience={EXPERIENCE} />
        </div>
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "0 800px" }}>
          <ProjectsSection projects={PROJECTS} onSelectProject={setSelectedProject} />
        </div>
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "0 600px" }}>
          <CertificatesSection
            categories={categories}
            selectedCategory={selectedCategory}
            certificates={CERTIFICATES}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "0 500px" }}>
          <ContactSection contact={CONTACT} />
        </div>
      </Suspense>
      {selectedProject ? (
        <Suspense>
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </Suspense>
      ) : null}
    </>
  );
}
