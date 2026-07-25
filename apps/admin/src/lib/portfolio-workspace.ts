import {
  PORTFOLIO_WRITING_CMS_SELECT_COLUMNS,
  PORTFOLIO_ADMIN_SELECT_COLUMNS,
  type PortfolioWritingPostRecord,
  type PortfolioNavigationPublicRow,
  type PortfolioSectionContentPublicRow,
  type PortfolioSectionKey,
} from "@repo/portfolio-data";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  About,
  Certificate,
  Contact,
  Education,
  Experience,
  Hero,
  NavItem,
  WorkItem,
  SectionContent,
  Skill,
  SkillCategory,
  SkillCategoryWithSkills,
} from "@/lib/types";
import { castPortfolioRecord } from "@/lib/portfolio-admin-data";

type AdminSupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

async function getSectionEditorialContext(
  supabase: AdminSupabaseClient,
  sectionKey: PortfolioSectionKey,
): Promise<{
  sectionContent: SectionContent | null;
  navigation: NavItem | null;
}> {
  const [sectionContentResult, navigationResult] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("section_content")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.section_content)
      .eq("section_key", sectionKey)
      .maybeSingle(),
    supabase
      .schema("portfolio")
      .from("nav_items")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.nav_items)
      .eq("section_id", sectionKey)
      .maybeSingle(),
  ]);

  if (sectionContentResult.error || navigationResult.error) {
    throw new Error(
      [sectionContentResult.error?.message, navigationResult.error?.message]
        .filter(Boolean)
        .join("; "),
    );
  }

  return {
    sectionContent: sectionContentResult.data as unknown as
      | (SectionContent & PortfolioSectionContentPublicRow)
      | null,
    navigation: navigationResult.data as unknown as
      | (NavItem & PortfolioNavigationPublicRow)
      | null,
  };
}

type PortfolioWorkspaceEditorialMap = Partial<
  Record<PortfolioSectionKey, PortfolioWorkspaceEditorial>
>;

/** Load multiple normalized presentation rows for one owning workspace. */
async function getSectionEditorialContexts(
  supabase: AdminSupabaseClient,
  sectionKeys: readonly PortfolioSectionKey[],
): Promise<PortfolioWorkspaceEditorialMap> {
  const entries = await Promise.all(
    sectionKeys.map(
      async (sectionKey) =>
        [
          sectionKey,
          await getSectionEditorialContext(supabase, sectionKey),
        ] as const,
    ),
  );

  return Object.fromEntries(entries) as PortfolioWorkspaceEditorialMap;
}

function requireEditorialContext(
  editorialBySection: PortfolioWorkspaceEditorialMap,
  sectionKey: PortfolioSectionKey,
): PortfolioWorkspaceEditorial {
  const editorial = editorialBySection[sectionKey];
  if (!editorial) {
    throw new Error(`Unable to load ${sectionKey} presentation context`);
  }
  return editorial;
}

interface PortfolioWorkspaceEditorial {
  sectionContent: SectionContent | null;
  navigation: NavItem | null;
}

export interface HomeWorkspaceData {
  hero: Hero | null;
  editorial: PortfolioWorkspaceEditorial;
  editorialBySection: PortfolioWorkspaceEditorialMap;
}

export interface AboutWorkspaceData {
  about: About | null;
  education: Education[];
  editorial: PortfolioWorkspaceEditorial;
  editorialBySection: PortfolioWorkspaceEditorialMap;
}

export interface SkillsWorkspaceData {
  categories: SkillCategoryWithSkills[];
  editorial: PortfolioWorkspaceEditorial;
}

export interface ExperienceWorkspaceData {
  experience: Experience[];
  certificates: Certificate[];
  editorial: PortfolioWorkspaceEditorial;
  editorialBySection: PortfolioWorkspaceEditorialMap;
}

export interface ActivityWorkspaceData {
  hero: Pick<Hero, "id" | "github_username"> | null;
  editorial: PortfolioWorkspaceEditorial;
}

export interface WorkWorkspaceData {
  work: WorkItem[];
  editorial: PortfolioWorkspaceEditorial;
}

export interface WritingWorkspaceData {
  posts: PortfolioWritingPostRecord[];
  editorial: PortfolioWorkspaceEditorial;
  editorialBySection: PortfolioWorkspaceEditorialMap;
}

export interface ContactWorkspaceData {
  contact: Contact | null;
  editorial: PortfolioWorkspaceEditorial;
}

function throwWorkspaceLoadError(
  workspace: string,
  errors: Array<{ message?: string } | null | undefined>,
) {
  const message = errors
    .map((error) => error?.message)
    .filter(Boolean)
    .join("; ");

  if (message) throw new Error(`Unable to load ${workspace}: ${message}`);
}

/** Load Home's content and presentation records as one typed workspace. */
export async function loadHomeWorkspace(
  supabase: AdminSupabaseClient,
): Promise<HomeWorkspaceData> {
  const [heroResult, editorialBySection] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("hero")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.hero)
      .maybeSingle(),
    getSectionEditorialContexts(supabase, ["hero", "resume"]),
  ]);
  throwWorkspaceLoadError("Home", [heroResult.error]);

  return {
    hero: castPortfolioRecord<Hero | null>(heroResult.data),
    editorial: requireEditorialContext(editorialBySection, "hero"),
    editorialBySection,
  };
}

/** Load About and its education timeline with the section presentation. */
export async function loadAboutWorkspace(
  supabase: AdminSupabaseClient,
): Promise<AboutWorkspaceData> {
  const [aboutResult, educationResult, editorialBySection] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("about")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.about)
      .maybeSingle(),
    supabase
      .schema("portfolio")
      .from("education")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.education)
      .order("sort_order", { ascending: true }),
    getSectionEditorialContexts(supabase, ["about", "education"]),
  ]);
  throwWorkspaceLoadError("About", [aboutResult.error, educationResult.error]);

  return {
    about: castPortfolioRecord<About | null>(aboutResult.data),
    education: castPortfolioRecord<Education[]>(educationResult.data ?? []),
    editorial: requireEditorialContext(editorialBySection, "about"),
    editorialBySection,
  };
}

/** Load skill categories and skills together, preserving public order. */
export async function loadSkillsWorkspace(
  supabase: AdminSupabaseClient,
): Promise<SkillsWorkspaceData> {
  const [categoriesResult, skillsResult, editorial] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("skill_categories")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.skill_categories)
      .order("sort_order", { ascending: true }),
    supabase
      .schema("portfolio")
      .from("skills")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.skills)
      .order("sort_order", { ascending: true }),
    getSectionEditorialContext(supabase, "skills"),
  ]);
  throwWorkspaceLoadError("Skills", [
    categoriesResult.error,
    skillsResult.error,
  ]);

  const categories = castPortfolioRecord<SkillCategory[]>(
    categoriesResult.data ?? [],
  );
  const skills = castPortfolioRecord<Skill[]>(skillsResult.data ?? []);

  return {
    categories: categories.map((category) => ({
      ...category,
      skills: skills.filter((skill) => skill.category_id === category.id),
    })),
    editorial,
  };
}

/** Load the Experience timeline and credential deck as one workspace. */
export async function loadExperienceWorkspace(
  supabase: AdminSupabaseClient,
): Promise<ExperienceWorkspaceData> {
  const [experienceResult, certificatesResult, editorialBySection] =
    await Promise.all([
      supabase
        .schema("portfolio")
        .from("experience")
        .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.experience)
        .order("sort_order", { ascending: true }),
      supabase
        .schema("portfolio")
        .from("certificates")
        .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.certificates)
        .order("sort_order", { ascending: true }),
      getSectionEditorialContexts(supabase, ["experience", "credentials"]),
    ]);
  throwWorkspaceLoadError("Experience", [
    experienceResult.error,
    certificatesResult.error,
  ]);

  return {
    experience: castPortfolioRecord<Experience[]>(experienceResult.data ?? []),
    certificates: castPortfolioRecord<Certificate[]>(
      certificatesResult.data ?? [],
    ),
    editorial: requireEditorialContext(editorialBySection, "experience"),
    editorialBySection,
  };
}

/** Load GitHub's editable source and its editorial framing. */
export async function loadActivityWorkspace(
  supabase: AdminSupabaseClient,
): Promise<ActivityWorkspaceData> {
  const [heroResult, editorial] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("hero")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.hero)
      .maybeSingle(),
    getSectionEditorialContext(supabase, "activity"),
  ]);
  throwWorkspaceLoadError("GitHub", [heroResult.error]);

  const hero = castPortfolioRecord<Hero | null>(heroResult.data);
  return {
    hero: hero ? { id: hero.id, github_username: hero.github_username } : null,
    editorial,
  };
}

/** Load all work and their Work presentation records. */
export async function loadWorkWorkspace(
  supabase: AdminSupabaseClient,
): Promise<WorkWorkspaceData> {
  const [workResult, editorial] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("work")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.work)
      .order("sort_order", { ascending: true }),
    getSectionEditorialContext(supabase, "work"),
  ]);
  throwWorkspaceLoadError("Work", [workResult.error]);

  return {
    work: castPortfolioRecord<WorkItem[]>(workResult.data ?? []),
    editorial,
  };
}

/** Load the full CMS Writing rows and Writing presentation records. */
export async function loadWritingWorkspace(
  supabase: AdminSupabaseClient,
): Promise<WritingWorkspaceData> {
  const [postsResult, editorialBySection] = await Promise.all([
    supabase
      .schema("jg_app")
      .from("writing_posts")
      .select(PORTFOLIO_WRITING_CMS_SELECT_COLUMNS)
      .order("published_at", { ascending: false }),
    getSectionEditorialContexts(supabase, ["writing", "article"]),
  ]);
  throwWorkspaceLoadError("Writing", [postsResult.error]);

  return {
    posts: castPortfolioRecord<PortfolioWritingPostRecord[]>(
      postsResult.data ?? [],
    ),
    editorial: requireEditorialContext(editorialBySection, "writing"),
    editorialBySection,
  };
}

/** Load Contact and its public presentation records. */
export async function loadContactWorkspace(
  supabase: AdminSupabaseClient,
): Promise<ContactWorkspaceData> {
  const [contactResult, editorial] = await Promise.all([
    supabase
      .schema("portfolio")
      .from("contact")
      .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.contact)
      .maybeSingle(),
    getSectionEditorialContext(supabase, "contact"),
  ]);
  throwWorkspaceLoadError("Contact", [contactResult.error]);

  return {
    contact: castPortfolioRecord<Contact | null>(contactResult.data),
    editorial,
  };
}
