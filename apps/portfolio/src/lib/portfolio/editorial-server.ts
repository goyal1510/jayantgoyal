import { cache } from "react";

import {
  isSkillProficiency,
  readPersonalInfo,
  readPrinciples,
  readSocialLinks,
  readStringArray,
  PORTFOLIO_SELECT_COLUMNS,
  PORTFOLIO_SECTION_KEYS,
  type PortfolioAboutPublicRow,
  type PortfolioCertificatePublicRow,
  type PortfolioContactPublicRow,
  type PortfolioEducationPublicRow,
  type PortfolioExperiencePublicRow,
  type PortfolioHeroPublicRow,
  type PortfolioNavigationPublicRow,
  type PortfolioProjectPublicRow,
  type PortfolioSectionContentPublicRow,
  type PortfolioSkillCategoryPublicRow,
  type PortfolioSkillPublicRow,
} from "@repo/portfolio-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  type PortfolioAbout,
  type PortfolioCredential,
  type PortfolioEditorialData,
  type PortfolioNavigationItem,
  type PortfolioProfile,
  type PortfolioProject,
  type PortfolioSectionContentMap,
  type PortfolioSocialLink,
  type ProjectTone,
  type SkillProficiency,
} from "./editorial-data";

type HeroRow = PortfolioHeroPublicRow;
type AboutRow = PortfolioAboutPublicRow;
type EducationRow = PortfolioEducationPublicRow;
type ExperienceRow = PortfolioExperiencePublicRow;
type SkillCategoryRow = PortfolioSkillCategoryPublicRow;
type SkillRow = PortfolioSkillPublicRow;
type ProjectRow = PortfolioProjectPublicRow;
type CertificateRow = PortfolioCertificatePublicRow;
type ContactRow = PortfolioContactPublicRow;
type NavigationRow = PortfolioNavigationPublicRow;
type SectionContentRow = PortfolioSectionContentPublicRow;

function castData<T>(value: unknown): T {
  return value as T;
}

function mapSocials(value: unknown): PortfolioSocialLink[] {
  return readSocialLinks(value).map((row) => ({
    label: row.label,
    href: row.href,
    iconKey: row.icon_key,
  }));
}

function mapProficiency(value: string): SkillProficiency {
  if (isSkillProficiency(value)) return value;

  throw new Error(`Unsupported skill proficiency: ${value}`);
}

function mapProject(row: ProjectRow, index: number): PortfolioProject {
  const tones: ProjectTone[] = ["paper", "ink", "signal"];

  return {
    id: row.slug,
    title: row.name,
    eyebrow: row.eyebrow,
    summary: row.short_description,
    impact: row.impact,
    role: row.contribution,
    year: row.year_label,
    image: row.image_url,
    imageAlt: row.image_alt,
    href: row.live_link,
    github: row.github_link,
    tags: readStringArray(row.tags),
    tone: tones[index % tones.length] ?? "paper",
  };
}

function mapCredential(row: CertificateRow): PortfolioCredential {
  return {
    name: row.name,
    issuer: row.issuer,
    category: row.category,
    description: row.description,
    issuedAt: row.issued_at,
    credentialId: row.credential_id,
    credentialUrl: row.credential_url,
    href: row.document_url,
    image: row.preview_url,
    imageAlt: row.image_alt,
  };
}

function mapProfile(hero: HeroRow, contact: ContactRow): PortfolioProfile {
  const socials = mapSocials(contact.socials);
  const github =
    socials.find((social) =>
      `${social.label} ${social.iconKey}`.toLowerCase().includes("github"),
    )?.href ?? `https://github.com/${hero.github_username}`;

  return {
    name: hero.name,
    displayName: hero.display_name,
    role: hero.role,
    headline: hero.headline,
    introduction: hero.blurb,
    focus: hero.tagline,
    currentRole: hero.current_title,
    availability: hero.availability,
    resume: hero.resume_url,
    githubUsername: hero.github_username,
    github,
    seoTitle: hero.seo_title,
    seoDescription: hero.seo_description,
    location: contact.location,
    email: contact.email,
    phone: contact.phone,
    socials,
  };
}

function mapAbout(row: AboutRow): PortfolioAbout {
  return {
    headline: row.headline,
    objective: row.objective,
    lead: row.summary,
    story: readStringArray(row.story),
    facts: readPersonalInfo(row.personal),
  };
}

function mapNavigation(rows: NavigationRow[]): PortfolioNavigationItem[] {
  return rows.map((row) => ({
    key: row.section_id,
    label: row.label,
    note: row.note ?? row.label,
  }));
}

function mapSectionContent(
  rows: SectionContentRow[],
): PortfolioSectionContentMap {
  const rowsByKey = new Map(rows.map((row) => [row.section_key, row]));

  return Object.fromEntries(
    PORTFOLIO_SECTION_KEYS.map((key) => {
      const row = rowsByKey.get(key);
      if (!row) throw new Error(`Missing CMS section copy: ${key}`);

      return [
        key,
        {
          eyebrow: row.eyebrow,
          headline: row.headline ?? "",
          accent: row.accent ?? "",
          description: row.description ?? "",
          supportingText: row.supporting_text ?? "",
          isVisible: row.is_visible,
        },
      ];
    }),
  ) as PortfolioSectionContentMap;
}

function throwQueryErrors(
  results: Array<{ error: { message: string } | null }>,
): void {
  const messages = results.flatMap((result) =>
    result.error ? [result.error.message] : [],
  );
  if (messages.length > 0) throw new Error(messages.join("; "));
}

export const getEditorialPortfolioData = cache(
  async (): Promise<PortfolioEditorialData> => {
    const supabase = await createSupabaseServerClient();
    const [
      heroResult,
      aboutResult,
      educationResult,
      experienceResult,
      categoriesResult,
      skillsResult,
      projectsResult,
      certificatesResult,
      contactResult,
      navigationResult,
      sectionContentResult,
    ] = await Promise.all([
      supabase
        .schema("portfolio")
        .from("hero")
        .select(PORTFOLIO_SELECT_COLUMNS.hero)
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("about")
        .select(PORTFOLIO_SELECT_COLUMNS.about)
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("education")
        .select(PORTFOLIO_SELECT_COLUMNS.education)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("experience")
        .select(PORTFOLIO_SELECT_COLUMNS.experience)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("skill_categories")
        .select(PORTFOLIO_SELECT_COLUMNS.skill_categories)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("skills")
        .select(PORTFOLIO_SELECT_COLUMNS.skills)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("projects")
        .select(PORTFOLIO_SELECT_COLUMNS.projects)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("certificates")
        .select(PORTFOLIO_SELECT_COLUMNS.certificates)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("contact")
        .select(PORTFOLIO_SELECT_COLUMNS.contact)
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("nav_items")
        .select(PORTFOLIO_SELECT_COLUMNS.nav_items)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("section_content")
        .select(PORTFOLIO_SELECT_COLUMNS.section_content),
    ]);

    throwQueryErrors([
      heroResult,
      aboutResult,
      educationResult,
      experienceResult,
      categoriesResult,
      skillsResult,
      projectsResult,
      certificatesResult,
      contactResult,
      navigationResult,
      sectionContentResult,
    ]);

    if (!heroResult.data || !aboutResult.data || !contactResult.data) {
      throw new Error("Core Portfolio CMS records are missing");
    }

    const hero = castData<HeroRow>(heroResult.data);
    const about = castData<AboutRow>(aboutResult.data);
    const contact = castData<ContactRow>(contactResult.data);
    const categories = castData<SkillCategoryRow[]>(categoriesResult.data ?? []);
    const skills = castData<SkillRow[]>(skillsResult.data ?? []);

    return {
      profile: mapProfile(hero, contact),
      about: mapAbout(about),
      navigation: mapNavigation(
        castData<NavigationRow[]>(navigationResult.data ?? []),
      ),
      sectionContent: mapSectionContent(
        castData<SectionContentRow[]>(sectionContentResult.data ?? []),
      ),
      education: castData<EducationRow[]>(educationResult.data ?? []).map(
        (row) => ({
          school: row.school,
          degree: row.degree,
          period: row.period,
          location: row.location ?? "",
          detail: row.detail ?? "",
        }),
      ),
      experience: castData<ExperienceRow[]>(experienceResult.data ?? []).map(
        (row) => ({
          company: row.company,
          role: row.role,
          period: row.period,
          location: row.location ?? "",
          summary: row.summary ?? "",
      outcomes: readStringArray(row.bullets),
        }),
      ),
      skillGroups: categories.map((category) => ({
        title: category.title,
        description: category.description,
        items: skills
          .filter((skill) => skill.category_id === category.id)
          .map((skill) => ({
            name: skill.name,
            proficiency: mapProficiency(skill.proficiency),
            evidence: skill.evidence,
          })),
      })),
      projects: castData<ProjectRow[]>(projectsResult.data ?? []).map(mapProject),
      credentials: castData<CertificateRow[]>(
        certificatesResult.data ?? [],
      ).map(
        mapCredential,
      ),
      principles: readPrinciples(about.principles),
    };
  },
);

export const getPortfolioShellData = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const [heroResult, contactResult, navigationResult, sectionContentResult] =
    await Promise.all([
      supabase
        .schema("portfolio")
        .from("hero")
        .select(PORTFOLIO_SELECT_COLUMNS.hero)
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("contact")
        .select(PORTFOLIO_SELECT_COLUMNS.contact)
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("nav_items")
        .select(PORTFOLIO_SELECT_COLUMNS.nav_items)
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("section_content")
        .select(PORTFOLIO_SELECT_COLUMNS.section_content),
    ]);

  throwQueryErrors([
    heroResult,
    contactResult,
    navigationResult,
    sectionContentResult,
  ]);

  if (!heroResult.data || !contactResult.data) {
    throw new Error("Portfolio shell CMS records are missing");
  }

  const profile = mapProfile(
    castData<HeroRow>(heroResult.data),
    castData<ContactRow>(contactResult.data),
  );

  return {
    brandLabel: profile.displayName,
    navigation: mapNavigation(
      castData<NavigationRow[]>(navigationResult.data ?? []),
    ),
    profile,
    sectionContent: mapSectionContent(
      castData<SectionContentRow[]>(sectionContentResult.data ?? []),
    ),
  };
});

export const getPortfolioContactEmail = cache(async (): Promise<string> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("contact")
    .select("email")
    .maybeSingle();

  if (error) throw new Error(error.message);
  const email = (data as { email?: string } | null)?.email;
  if (!email) throw new Error("Portfolio contact recipient is missing");
  return email;
});
