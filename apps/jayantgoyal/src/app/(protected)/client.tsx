'use client';

import { useMemo, useState, useEffect } from "react";
import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";
import { CodeStatsSection } from "@/components/portfolio/code-stats-section";
import { HeroSection } from "@/components/portfolio/sections/hero-section";
import { AboutSection } from "@/components/portfolio/sections/about-section";
import { SkillsSection } from "@/components/portfolio/sections/skills-section";
import { ExperienceSection } from "@/components/portfolio/sections/experience-section";
import { ProjectsSection, ProjectModal } from "@/components/portfolio/sections/projects-section";
import { CertificatesSection } from "@/components/portfolio/sections/certificates-section";
import { GithubActivitySection } from "@/components/portfolio/sections/github-activity-section";
import { ContactSection } from "@/components/portfolio/sections/contact-section";
import type { Project } from "@/components/portfolio/shared";

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
        <HeroSection hero={HERO} source={source} />
        <AboutSection about={ABOUT} education={EDUCATION} />
        <SkillsSection skillSets={SKILL_SETS} techIcons={TECH_ICONS} />
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
        {selectedProject ? (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        ) : null}
      </div>
    </>
  );
}
