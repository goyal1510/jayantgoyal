import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Code2,
  FolderKanban,
  Home,
  Mail,
  UserRound,
} from "lucide-react";

import {
  PORTFOLIO_ADMIN_SELECT_COLUMNS,
  PORTFOLIO_BLOG_CMS_SELECT_COLUMNS,
  PORTFOLIO_WORKSPACE_ROUTES,
  type PortfolioNavigationRecord,
  type PortfolioSectionContentRecord,
  type PortfolioHeroPublicRow,
} from "@repo/portfolio-data";
import { Badge } from "@repo/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Button } from "@repo/ui/button";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { castPortfolioRecord } from "@/lib/portfolio-admin-data";

export const metadata: Metadata = { title: "Portfolio Overview" };

const workspaces = [
  {
    label: "Home",
    description:
      "The first impression: identity, invitation, availability, resume, and the story search engines meet first.",
    href: PORTFOLIO_WORKSPACE_ROUTES.home,
    icon: Home,
    key: "home",
  },
  {
    label: "About",
    description:
      "Story, education, principles, and the person behind the work.",
    href: PORTFOLIO_WORKSPACE_ROUTES.about,
    icon: UserRound,
    key: "about",
  },
  {
    label: "Skills",
    description: "The frontend, backend, tooling, and product systems you use.",
    href: PORTFOLIO_WORKSPACE_ROUTES.skills,
    icon: Code2,
    key: "skills",
  },
  {
    label: "Experience",
    description: "Roles, outcomes, and credentials in one professional story.",
    href: PORTFOLIO_WORKSPACE_ROUTES.experience,
    icon: BriefcaseBusiness,
    key: "experience",
  },
  {
    label: "Activity",
    description:
      "The live GitHub signal and the editorial framing around the work happening in public.",
    href: PORTFOLIO_WORKSPACE_ROUTES.activity,
    icon: Activity,
    key: "activity",
  },
  {
    label: "Work",
    description:
      "Projects, screenshots, links, and the work worth remembering.",
    href: PORTFOLIO_WORKSPACE_ROUTES.work,
    icon: FolderKanban,
    key: "projects",
  },
  {
    label: "Writing",
    description: "Published notes, articles, and the ideas behind the work.",
    href: PORTFOLIO_WORKSPACE_ROUTES.writing,
    icon: BookOpen,
    key: "blog",
  },
  {
    label: "Contact",
    description: "The address, social links, and response path for enquiries.",
    href: PORTFOLIO_WORKSPACE_ROUTES.contact,
    icon: Mail,
    key: "contact",
  },
] as const;

export default async function PortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const [
    hero,
    about,
    skills,
    experience,
    projects,
    contact,
    blog,
    sectionContent,
    navigation,
  ] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("hero")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.hero)
      .maybeSingle(),
    supabase
      .schema("portfolio")
      .from("about")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.about)
      .maybeSingle(),
    supabase
      .schema("portfolio")
      .from("skills")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.skills),
    supabase
      .schema("portfolio")
      .from("experience")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.experience),
    supabase
      .schema("portfolio")
      .from("projects")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.projects),
    supabase
      .schema("portfolio")
      .from("contact")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.contact)
      .maybeSingle(),
    supabase
      .schema("jg_app")
      .from("blog_posts")
      .select(PORTFOLIO_BLOG_CMS_SELECT_COLUMNS),
    supabase
      .schema("portfolio")
      .from("section_content")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.section_content),
    supabase
      .schema("portfolio")
      .from("nav_items")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.nav_items),
  ]);

  const queryErrors = [
    hero,
    about,
    skills,
    experience,
    projects,
    contact,
    blog,
    sectionContent,
    navigation,
  ].flatMap((result) => (result.error ? [result.error.message] : []));
  if (queryErrors.length > 0) {
    throw new Error(
      `Unable to load Portfolio overview: ${queryErrors.join("; ")}`,
    );
  }

  const records = {
    home: Boolean(hero.data),
    about: Boolean(about.data),
    skills: (skills.data ?? []).length > 0,
    experience: (experience.data ?? []).length > 0,
    activity: Boolean(
      (
        hero.data as unknown as { github_username?: string | null } | null
      )?.github_username?.trim(),
    ),
    projects: (projects.data ?? []).length > 0,
    blog: (blog.data ?? []).length > 0,
    contact: Boolean(contact.data),
  } as const;
  const completed = Object.values(records).filter(Boolean).length;
  const heroRecord = hero.data as unknown as PortfolioHeroPublicRow | null;
  const projectRows = (projects.data ?? []) as unknown as Array<{
    image_url?: string | null;
    image_alt?: string | null;
    live_link?: string | null;
    github_link?: string | null;
    short_description?: string | null;
  }>;
  const blogRows = (blog.data ?? []) as unknown as Array<{
    is_published: boolean;
    is_visible: boolean;
    published_at: string | null;
  }>;
  const sectionRows = castPortfolioRecord<PortfolioSectionContentRecord[]>(
    sectionContent.data ?? [],
  );
  const navigationRows = castPortfolioRecord<PortfolioNavigationRecord[]>(
    navigation.data ?? [],
  );
  const hiddenSections = sectionRows.filter((item) => !item.is_visible).length;
  const hiddenNavigation = navigationRows.filter(
    (item) => !item.is_visible,
  ).length;
  const missingProjectAlt = projectRows.filter(
    (project) => project.image_url && !project.image_alt,
  ).length;
  const drafts = blogRows.filter((post) => !post.is_published).length;
  const hiddenPosts = blogRows.filter((post) => !post.is_visible).length;
  const missingProjectImages = projectRows.filter(
    (project) => !project.image_url,
  ).length;
  const missingProjectLinks = projectRows.filter(
    (project) => !project.live_link && !project.github_link,
  ).length;
  const missingProjectCopy = projectRows.filter(
    (project) => !project.short_description?.trim(),
  ).length;
  const lastUpdatedSections = sectionRows
    .filter((item) => item.updated_at)
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() -
        new Date(left.updated_at).getTime(),
    )
    .slice(0, 3);
  const needsAttention =
    hiddenSections +
    hiddenNavigation +
    missingProjectAlt +
    missingProjectImages +
    missingProjectLinks +
    missingProjectCopy +
    drafts +
    hiddenPosts;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Portfolio CMS</Badge>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Editorial control room
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Shape the story, then publish with confidence.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Every workspace owns a meaningful part of the public Portfolio.
              Keep the content together, preview the effect, and leave the
              derived data to the integrations that own it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/portfolio/about">
                Start with About <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://jayantgoyal.com"
                target="_blank"
                rel="noreferrer"
              >
                View live Portfolio <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-3xl font-semibold tabular-nums">{completed}/8</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              content areas ready
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="truncate text-lg font-semibold">
              {heroRecord?.display_name || "Jayant"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {heroRecord?.role || "Portfolio owner"}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Content workspaces
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Edit the public story in the order people experience it.
            </h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">
            One owner per section · no detached copy screen
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => {
            const Icon = workspace.icon;
            const isReady = records[workspace.key];

            return (
              <Link key={workspace.key} href={workspace.href} className="group">
                <Card className="h-full transition-colors group-hover:border-foreground/30 group-hover:bg-muted/20">
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5" />
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isReady ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : null}
                      {isReady ? "Ready" : "Needs content"}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl">{workspace.label}</CardTitle>
                    <CardDescription className="mt-2 leading-6">
                      {workspace.description}
                    </CardDescription>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium">
                      Open workspace{" "}
                      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Editorial guardrails</CardTitle>
            <CardDescription>
              A few rules keep the CMS and the public Portfolio in sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              "Section copy lives beside the content it describes.",
              "Activity stays derived from GitHub instead of being hardcoded.",
              "Visibility and order are edited at the point of use.",
              "Legacy standalone routes redirect to their owning workspace.",
            ].map((rule) => (
              <div
                key={rule}
                className="flex gap-2 text-sm leading-6 text-muted-foreground"
              >
                <Check className="mt-1 size-4 shrink-0 text-emerald-500" />
                <span>{rule}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-xl">Need the full picture?</CardTitle>
            <CardDescription className="text-primary-foreground/70">
              Open the live site to validate the complete editorial flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <a
                href="https://jayantgoyal.com"
                target="_blank"
                rel="noreferrer"
              >
                Visit public Portfolio <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Content health</CardTitle>
            <CardDescription>
              Signals from the same records the public Portfolio reads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Needs attention</span>
              <Badge variant={needsAttention ? "secondary" : "outline"}>
                {needsAttention}
              </Badge>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              {missingProjectAlt ? (
                <li>
                  {missingProjectAlt} project screenshot description(s) missing.
                </li>
              ) : null}
              {missingProjectImages ? (
                <li>{missingProjectImages} project image(s) missing.</li>
              ) : null}
              {missingProjectLinks ? (
                <li>{missingProjectLinks} project link set(s) missing.</li>
              ) : null}
              {missingProjectCopy ? (
                <li>{missingProjectCopy} project summary(ies) missing.</li>
              ) : null}
              {drafts ? (
                <li>{drafts} writing item(s) still in draft.</li>
              ) : null}
              {hiddenPosts ? (
                <li>{hiddenPosts} writing item(s) hidden.</li>
              ) : null}
              {hiddenSections ? (
                <li>{hiddenSections} section presentation(s) hidden.</li>
              ) : null}
              {hiddenNavigation ? (
                <li>{hiddenNavigation} navigation item(s) hidden.</li>
              ) : null}
              {!needsAttention ? (
                <li>All current content signals look healthy.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recently updated</CardTitle>
            <CardDescription>
              Latest section presentation changes recorded by the CMS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastUpdatedSections.length ? (
              <ul className="space-y-3">
                {lastUpdatedSections.map((section) => (
                  <li
                    key={section.section_key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium capitalize">
                      {section.section_key}
                    </span>
                    <time className="text-xs text-muted-foreground">
                      {new Date(section.updated_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No section update timestamps are available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
