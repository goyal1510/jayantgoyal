import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  PORTFOLIO_SECTION_KEYS,
  type PortfolioAbout,
  type PortfolioCredential,
  type PortfolioEditorialData,
  type PortfolioNavigationItem,
  type PortfolioPrinciple,
  type PortfolioProfile,
  type PortfolioProject,
  type PortfolioSectionContentMap,
  type PortfolioSocialLink,
  type ProjectTone,
  type SkillProficiency,
} from "./editorial-data";

type HeroRow = {
  name: string;
  display_name: string;
  role: string;
  tagline: string;
  blurb: string;
  headline: string;
  current_title: string;
  availability: string;
  resume_url: string;
  github_username: string;
  seo_title: string;
  seo_description: string;
};

type AboutRow = {
  headline: string;
  objective: string;
  summary: string;
  story: unknown;
  personal: unknown;
  principles: unknown;
};

type EducationRow = {
  school: string;
  degree: string;
  period: string;
  location: string | null;
  detail: string | null;
};

type ExperienceRow = {
  company: string;
  role: string;
  period: string;
  location: string | null;
  summary: string | null;
  bullets: unknown;
};

type SkillCategoryRow = {
  id: string;
  title: string;
  description: string;
};

type SkillRow = {
  category_id: string;
  name: string;
  proficiency: string;
  evidence: string;
};

type ProjectRow = {
  name: string;
  slug: string;
  eyebrow: string;
  short_description: string;
  impact: string;
  contribution: string;
  year_label: string;
  image_url: string;
  image_alt: string;
  tags: unknown;
  github_link: string | null;
  live_link: string | null;
};

type CertificateRow = {
  name: string;
  description: string | null;
  category: string;
  issuer: string;
  issued_at: string | null;
  credential_id: string | null;
  credential_url: string | null;
  document_url: string;
  preview_url: string;
  image_alt: string;
};

type SocialLinkRow = {
  label?: unknown;
  href?: unknown;
  icon_key?: unknown;
};

type ContactRow = {
  email: string;
  phone: string;
  location: string;
  socials: unknown;
};

type NavigationRow = {
  section_id: string;
  label: string;
  note: string | null;
};

type SectionContentRow = {
  section_key: string;
  eyebrow: string;
  headline: string | null;
  accent: string | null;
  description: string | null;
  supporting_text: string | null;
  is_visible: boolean;
};

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function personalFacts(
  value: unknown,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const label = "label" in item ? item.label : null;
    const factValue = "value" in item ? item.value : null;
    if (typeof label !== "string" || typeof factValue !== "string") return [];
    if (label.toLowerCase() === "name") return [];
    return [{ label, value: factValue }];
  });
}

function mapPrinciples(value: unknown): PortfolioPrinciple[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const title = "title" in item ? item.title : null;
    const copy = "copy" in item ? item.copy : null;
    return typeof title === "string" && typeof copy === "string"
      ? [{ title, copy }]
      : [];
  });
}

function mapSocials(value: unknown): PortfolioSocialLink[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as SocialLinkRow;
    if (typeof row.label !== "string" || typeof row.href !== "string") {
      return [];
    }

    return [
      {
        label: row.label,
        href: row.href,
        iconKey: typeof row.icon_key === "string" ? row.icon_key : "Globe",
      },
    ];
  });
}

function mapProficiency(value: string): SkillProficiency {
  if (
    value === "core" ||
    value === "strong" ||
    value === "working" ||
    value === "exploring"
  ) {
    return value;
  }

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
    tags: strings(row.tags),
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
    story: strings(row.story),
    facts: personalFacts(row.personal),
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
        .select(
          "name, display_name, role, tagline, blurb, headline, current_title, availability, resume_url, github_username, seo_title, seo_description",
        )
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("about")
        .select("headline, objective, summary, story, personal, principles")
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("education")
        .select("school, degree, period, location, detail")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("experience")
        .select("company, role, period, location, summary, bullets")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("skill_categories")
        .select("id, title, description")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("skills")
        .select("category_id, name, proficiency, evidence")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("projects")
        .select(
          "name, slug, eyebrow, short_description, impact, contribution, year_label, image_url, image_alt, tags, github_link, live_link",
        )
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("certificates")
        .select(
          "name, description, category, issuer, issued_at, credential_id, credential_url, document_url, preview_url, image_alt",
        )
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("contact")
        .select("email, phone, location, socials")
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("nav_items")
        .select("section_id, label, note")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("section_content")
        .select(
          "section_key, eyebrow, headline, accent, description, supporting_text, is_visible",
        ),
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

    const hero = heroResult.data as HeroRow;
    const about = aboutResult.data as AboutRow;
    const contact = contactResult.data as ContactRow;
    const categories = (categoriesResult.data ?? []) as SkillCategoryRow[];
    const skills = (skillsResult.data ?? []) as SkillRow[];

    return {
      profile: mapProfile(hero, contact),
      about: mapAbout(about),
      navigation: mapNavigation(
        (navigationResult.data ?? []) as NavigationRow[],
      ),
      sectionContent: mapSectionContent(
        (sectionContentResult.data ?? []) as SectionContentRow[],
      ),
      education: ((educationResult.data ?? []) as EducationRow[]).map(
        (row) => ({
          school: row.school,
          degree: row.degree,
          period: row.period,
          location: row.location ?? "",
          detail: row.detail ?? "",
        }),
      ),
      experience: ((experienceResult.data ?? []) as ExperienceRow[]).map(
        (row) => ({
          company: row.company,
          role: row.role,
          period: row.period,
          location: row.location ?? "",
          summary: row.summary ?? "",
          outcomes: strings(row.bullets),
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
      projects: ((projectsResult.data ?? []) as ProjectRow[]).map(mapProject),
      credentials: ((certificatesResult.data ?? []) as CertificateRow[]).map(
        mapCredential,
      ),
      principles: mapPrinciples(about.principles),
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
        .select(
          "name, display_name, role, tagline, blurb, headline, current_title, availability, resume_url, github_username, seo_title, seo_description",
        )
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("contact")
        .select("email, phone, location, socials")
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("nav_items")
        .select("section_id, label, note")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .schema("portfolio")
        .from("section_content")
        .select(
          "section_key, eyebrow, headline, accent, description, supporting_text, is_visible",
        ),
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
    heroResult.data as HeroRow,
    contactResult.data as ContactRow,
  );

  return {
    brandLabel: profile.displayName,
    navigation: mapNavigation((navigationResult.data ?? []) as NavigationRow[]),
    profile,
    sectionContent: mapSectionContent(
      (sectionContentResult.data ?? []) as SectionContentRow[],
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
