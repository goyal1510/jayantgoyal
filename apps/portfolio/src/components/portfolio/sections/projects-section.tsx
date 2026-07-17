"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { ExternalLink, Github, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";
import { resolveProjectUrl } from "@/lib/platform-urls";
import {
  sectionId,
  sectionScrollMargin,
  SectionHeader,
  Badge,
  type Project,
} from "@/components/portfolio/shared";

export function ProjectsSection({
  projects,
  onSelectProject,
}: {
  projects: SerializablePortfolioData["PROJECTS"];
  onSelectProject: (project: Project) => void;
}) {
  return (
    <section
      id={sectionId("projects")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="My Projects"
        description="A selection of builds and experiments that showcase how I work."
      />
      <Separator className="my-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.name}
            project={project}
            index={index}
            onSelectProject={onSelectProject}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  onSelectProject,
}: {
  project: Project;
  index: number;
  onSelectProject: (project: Project) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const projectImage = isDark
    ? project.imageDark || project.imageLight
    : project.imageLight || project.imageDark;

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      viewport={{ once: true }}
    >
      <Card
        className="group h-full cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
        onClick={() => onSelectProject(project)}
      >
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <Image
            src={projectImage}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardHeader>
          <CardTitle className="text-lg leading-tight">
            {project.name}
          </CardTitle>
          <CardDescription>{project.shortDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 ? (
            <Badge variant="secondary">+{project.tags.length - 3}</Badge>
          ) : null}
        </CardContent>
      </Card>
    </m.div>
  );
}

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const hasGithubLink = Boolean(project.githubLink);
  const hasLiveLink = Boolean(project.liveLink);
  const liveLink = hasLiveLink ? resolveProjectUrl(project.liveLink) : "";

  const projectImage = isDark
    ? project.imageDark || project.imageLight
    : project.imageLight || project.imageDark;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4"
      onClick={onClose}
    >
      <m.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
          <h2 className="truncate text-lg font-semibold sm:text-xl">
            {project.name}
          </h2>
          <button
            type="button"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80"
            onClick={onClose}
            aria-label="Close project"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="relative h-48 w-full sm:h-64 md:h-72">
            <Image
              src={projectImage}
              alt={project.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {hasGithubLink ? (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={project.githubLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="size-4" />
                    Code
                  </Link>
                </Button>
              ) : null}
              {hasLiveLink ? (
                <Button size="sm" asChild>
                  <Link href={liveLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Live Demo
                  </Link>
                </Button>
              ) : null}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold sm:text-lg">
                  Description
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.fullDescription}
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold sm:text-lg">
                  Technologies Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </m.div>
  );
}
