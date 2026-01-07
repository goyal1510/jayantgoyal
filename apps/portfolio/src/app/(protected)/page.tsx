'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Award,
  Calendar,
  Download,
  ExternalLink,
  Github,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PortfolioData } from "@/lib/portfolio-data";
import { usePortfolioData } from "@/lib/use-portfolio-data";
import { cn } from "@/lib/utils";
import { GithubCalendarComponent } from "@/components/github-calendar";
import { ContactForm } from "@/components/contact-form";

type SectionId = PortfolioData["NAV_ITEMS"][number]["id"];
type Project = PortfolioData["PROJECTS"][number];
type Certificate = PortfolioData["CERTIFICATES"][number];

const sectionId = (id: SectionId) => id;
const sectionScrollMargin = "scroll-mt-28";

export default function Page() {
  const { data } = usePortfolioData();
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

  return (
    <div className="space-y-16">
      <HeroSection hero={HERO} contact={CONTACT} />
      <AboutSection about={ABOUT} education={EDUCATION} />
      <SkillsSection skillSets={SKILL_SETS} techIcons={TECH_ICONS} />
      <GithubActivitySection contact={CONTACT} />
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
  );
}

function HeroSection({
  hero,
  contact,
}: {
  hero: PortfolioData["HERO"];
  contact: PortfolioData["CONTACT"];
}) {
  return (
    <section
      id={sectionId("home")}
      className={cn("relative overflow-hidden", sectionScrollMargin)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.4 }}
        className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8"
      >
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
      >
        <Sparkles className="size-4" />
        Welcome to my portfolio
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="space-y-3"
        >
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
            Hi, I&apos;m <span className="text-primary">{hero.name}</span>
          </h1>
          <p className="text-2xl text-muted-foreground">{hero.role}</p>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-2xl text-lg text-muted-foreground"
        >
          {hero.tagline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="group h-11">
            <Link href={`#${sectionId("contact")}`}>
              Get in touch
              <Mail className="ml-2 size-4 transition-transform group-hover:translate-y-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="group h-11">
            <Link href="/assets/Jayant_Resume.pdf" download="Jayant_Resume.pdf">
              Download CV
              <Download className="ml-2 size-4 transition-transform group-hover:translate-y-0.5" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

function AboutSection({
  about,
  education,
}: {
  about: PortfolioData["ABOUT"];
  education: PortfolioData["EDUCATION"];
}) {
  return (
    <section
      id={sectionId("about")}
      className={cn(
        "rounded-2xl bg-muted/40 px-4 py-12 sm:px-6 lg:px-8",
        sectionScrollMargin
      )}
    >
      <SectionHeader
        title="About Me"
        description="Get to know me better—my journey, passion, and what drives me to create."
      />
      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Career Objective</CardTitle>
            <CardDescription>
              Where I focus and how I like to work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aspiring Full Stack Developer skilled in Next.js, React.js, JavaScript, TypeScript and Supabase. Passionate about building innovative
              solutions and collaborating with teams to ship meaningful
              experiences.
            </p>
            <div className="space-y-2">
              {about.highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  <span className="size-2 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-10" />

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <h4 className="text-xl font-semibold">Education Journey</h4>
        </div>
        <div className="relative">
          <div className="absolute left-0 right-0 top-8 h-px bg-border" />
          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-6">
            {education.map((edu) => (
              <div
                key={`${edu.school}-${edu.period}`}
                className="relative flex-1 text-center"
              >
                <div className="mx-auto flex size-16 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg">
                  <span className="text-sm font-semibold">{edu.period}</span>
                </div>
                <div className="mt-4 space-y-1 rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm font-semibold">{edu.degree}</p>
                  <p className="text-xs text-muted-foreground">{edu.school}</p>
                  <p className="text-xs text-primary font-medium">
                    {edu.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SkillsSection({
  skillSets,
  techIcons,
}: {
  skillSets: PortfolioData["SKILL_SETS"];
  techIcons: PortfolioData["TECH_ICONS"];
}) {
  return (
    <section
      id={sectionId("skills")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="Skills & Technologies"
        description="The tools and stacks I reach for to ship reliable, user-friendly products."
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
        className="mt-10 flex flex-wrap justify-center gap-6 rounded-2xl bg-muted/30 p-6"
      >
        {techIcons.map((tech, index) => (
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-2 rounded-lg bg-background px-4 py-3 text-center shadow-sm"
          >
            <tech.icon className={cn("size-6", tech.color)} />
            <span className="text-sm text-muted-foreground">{tech.name}</span>
          </motion.div>
        ))}
      </motion.div>

      <Separator className="my-10" />

      <div className="grid gap-6 md:grid-cols-2">
        {skillSets.map((set, setIndex) => (
          <motion.div
            key={set.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: setIndex * 0.05 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <set.icon className={cn("size-5", set.color ?? "text-primary")} />
                  {set.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {set.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: itemIndex * 0.05 }}
                    viewport={{ once: true }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.level}%
                      </span>
                    </div>
                    <Progress value={item.level} />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ExperienceSection({
  experience,
}: {
  experience: PortfolioData["EXPERIENCE"];
}) {
  return (
    <section
      id={sectionId("experience")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="Work Experience"
        description="Recent roles, responsibilities, and the outcomes delivered."
      />
      <Separator className="my-8" />
      <div className="space-y-6">
        {experience.map((exp, index) => (
          <motion.div
            key={`${exp.company}-${exp.role}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            viewport={{ once: true }}
          >
            <Card className="relative">
              {index < experience.length - 1 ? (
                <div className="absolute left-6 top-full h-8 w-px bg-border" />
              ) : null}
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{exp.role}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {exp.company}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <InfoPill icon={Calendar} label={exp.period} />
                    <InfoPill icon={MapPin} label={exp.location} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{exp.summary}</p>
                <ul className="space-y-2">
                  {exp.bullets.map((item) => (
                    <li key={item}>
                      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection({
  projects,
  onSelectProject,
}: {
  projects: PortfolioData["PROJECTS"];
  onSelectProject: (project: Project) => void;
}) {
  return (
    <section
      id={sectionId("projects")}
      className={cn(
        "rounded-2xl bg-muted/30 px-4 py-12 sm:px-6 lg:px-8",
        sectionScrollMargin
      )}
    >
      <SectionHeader
        title="My Projects"
        description="A selection of builds and experiments that showcase how I work."
      />
      <Separator className="my-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.name}
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
                  src={project.image}
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
                {project.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 3 ? (
                  <Badge variant="secondary">
                    +{project.tags.length - 3}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const hasGithubLink = Boolean(project.githubLink);
  const hasLiveLink = Boolean(project.liveLink);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full border bg-muted p-1 text-muted-foreground transition hover:bg-muted/80"
          onClick={onClose}
          aria-label="Close project"
        >
          ×
        </button>
        <div className="relative h-72 w-full">
          <Image
            src={project.image}
            alt={project.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{project.name}</h2>
              <p className="text-sm text-muted-foreground">
                {project.shortDescription}
              </p>
            </div>
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
                  <Link
                    href={project.liveLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Live Demo
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {project.fullDescription}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Technologies Used</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CertificatesSection({
  categories,
  selectedCategory,
  certificates,
  onSelectCategory,
}: {
  categories: string[];
  selectedCategory: string;
  certificates: PortfolioData["CERTIFICATES"];
  onSelectCategory: (category: string) => void;
}) {
  const [openCertificate, setOpenCertificate] = useState<Certificate | null>(
    null
  );

  const filteredCertificates =
    selectedCategory === "All"
      ? certificates
      : certificates.filter((cert) => cert.category === selectedCategory);

  return (
    <section
      id={sectionId("certificates")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="My Certificates"
        description="Credentials and achievements that back up the hands-on work."
      />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      <Separator className="my-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCertificates.map((cert, index) => (
          <motion.div
            key={cert.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            viewport={{ once: true }}
          >
            <Card className="flex h-full flex-col transition hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="size-4 text-primary" />
                  <CardTitle className="text-base">{cert.name}</CardTitle>
                </div>
                <CardDescription>{cert.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between">
                <Badge variant="secondary">{cert.category}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenCertificate(cert)}
                >
                  <Link2 className="mr-2 size-4" />
                  View
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {openCertificate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenCertificate(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-lg bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">{openCertificate.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {openCertificate.issuer}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" asChild variant="outline">
                  <Link
                    href={openCertificate.path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Open
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenCertificate(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="h-[70vh]">
              <iframe
                src={openCertificate.path}
                title={openCertificate.name}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function GithubActivitySection({
  contact,
}: {
  contact: PortfolioData["CONTACT"];
}) {
  const githubSocial = contact.socials.find((social) => social.label === "GitHub");
  const githubUrl = githubSocial?.href;
  const githubUsername = githubUrl?.match(/github\.com\/([^\/]+)/)?.[1] || "goyal1510";

  return (
    <section
      id="github-activity"
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="Development Activity"
        description="Consistent daily coding and open source contributions"
      />
      <Separator className="my-8" />
      <div className="mx-auto max-w-4xl">
        <GithubCalendarComponent username={githubUsername} githubUrl={githubUrl} />
      </div>
    </section>
  );
}

function ContactSection({
  contact,
}: {
  contact: PortfolioData["CONTACT"];
}) {
  return (
    <section
      id={sectionId("contact")}
      className={cn(
        "rounded-2xl bg-muted/30 px-4 py-12 sm:px-6 lg:px-8",
        sectionScrollMargin
      )}
    >
      <SectionHeader
        title="Get In Touch"
        description="Open to opportunities, collaborations, and interesting problems to solve."
      />
      <Separator className="my-8" />
      <div className="grid gap-10 lg:grid-cols-2 items-stretch">
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Let&apos;s Connect</CardTitle>
              <CardDescription>
                Reach out anytime. I typically respond within a business day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContactItem
                icon={Mail}
                label="Email"
                value={contact.email}
                href={`mailto:${contact.email}`}
              />
              <ContactItem
                icon={Phone}
                label="Phone"
                value={contact.phone}
                href={`tel:${contact.phone}`}
              />
              <ContactItem
                icon={MapPin}
                label="Location"
                value={contact.location}
                href={`https://maps.google.com/?q=${encodeURIComponent(contact.location)}`}
              />
              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                {contact.socials.map((social) => (
                  <Button
                    key={social.label}
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex h-16 w-full flex-col items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center"
                  >
                    <Link href={social.href} target="_blank" rel="noreferrer">
                      <social.icon className={cn("size-5", social.color)} />
                      <span className="text-xs font-medium">{social.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Send a quick note</CardTitle>
            <CardDescription>
              I will reply via email as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.3 }}
      className="text-center"
    >
      <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-lg text-muted-foreground">{description}</p>
      ) : null}
    </motion.div>
  );
}

function InfoPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="size-4" />
      {label}
    </span>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
}) {
  const styles =
    variant === "secondary"
      ? "bg-muted text-foreground"
      : "bg-primary text-primary-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", styles)}>
      {children}
    </span>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-sm my-2">
      <Icon className="size-5 text-primary" />
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} target="_blank" rel="noreferrer">
        {content}
      </Link>
    );
  }

  return content;
}
