import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  fallbackPortfolioData,
  PORTFOLIO_SECTION_KEYS,
  type PortfolioAbout,
  type PortfolioCredential,
  type PortfolioEditorialData,
  type PortfolioNavigationItem,
  type PortfolioPrinciple,
  type PortfolioProfile,
  type PortfolioProject,
  type PortfolioSectionContentMap,
  type ProjectTone,
  type SkillProficiency,
} from "./editorial-data";

type HeroRow = {
  name: string;
  display_name?: string | null;
  role: string;
  tagline: string | null;
  blurb: string | null;
  headline?: string | null;
  current_title?: string | null;
  availability?: string | null;
  resume_url?: string | null;
  location: string | null;
};

type AboutRow = {
  headline?: string | null;
  objective?: string | null;
  summary: string | null;
  story?: unknown;
  personal: unknown;
  highlights: unknown;
  principles?: unknown;
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
  description?: string | null;
};

type SkillRow = {
  category_id: string;
  name: string;
  proficiency?: string | null;
  evidence?: string | null;
  is_featured?: boolean | null;
};

type ProjectRow = {
  name: string;
  slug?: string | null;
  eyebrow?: string | null;
  short_description: string | null;
  full_description: string | null;
  impact?: string | null;
  contribution?: string | null;
  year_label?: string | null;
  image_key?: string | null;
  image_alt?: string | null;
  tags: unknown;
  github_link: string | null;
  live_link: string | null;
};

type CertificateRow = {
  name: string;
  description: string | null;
  category: string | null;
  issuer: string | null;
  document_key?: string | null;
  preview_key?: string | null;
  image_alt?: string | null;
};

type SocialLinkRow = {
  label?: string;
  platform?: string;
  href?: string;
  url?: string;
};

type ContactRow = {
  email: string | null;
  phone: string | null;
  location: string | null;
  socials: unknown;
};

type NavigationRow = {
  section_id: string;
  label: string;
  note?: string | null;
};

type SectionContentRow = {
  section_key: string;
  eyebrow: string;
  headline: string | null;
  accent: string | null;
  description: string | null;
  supporting_text: string | null;
};

const projectAliases: Record<string, string> = {
  "Custom Drag & Drop Calculator": "custom-calculator",
  "E-commerce Application": "ecommerce",
  "Weather App": "weather",
};

const credentialAliases: Record<string, string> = {
  "Hackerrank Basic": "hackerrank-basic",
  "HackerRank Problem Solving (Basic)": "hackerrank-basic",
  "Hackerrank Intermediate": "hackerrank-intermediate",
  "HackerRank Problem Solving (Intermediate)": "hackerrank-intermediate",
  "HighRadius Internship Appreciation": "highradius-appreciation",
  "HighRadius Internship Completion": "highradius-product-engineer",
  "HighRadius Product Engineering Internship": "highradius-product-engineer",
  "Full Stack Development": "full-stack-development",
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

function principles(value: unknown): PortfolioPrinciple[] {
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

function socialLinks(value: unknown): SocialLinkRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SocialLinkRow =>
    Boolean(item && typeof item === "object"),
  );
}

function socialHref(
  socials: SocialLinkRow[],
  platform: string,
  fallback: string,
) {
  const match = socials.find((social) =>
    `${social.label ?? ""} ${social.platform ?? ""}`
      .toLowerCase()
      .includes(platform),
  );
  return match?.href ?? match?.url ?? fallback;
}

function proficiency(
  value: string | null | undefined,
): SkillProficiency | undefined {
  return value === "core" ||
    value === "strong" ||
    value === "working" ||
    value === "exploring"
    ? value
    : undefined;
}

function projectFallback(row: ProjectRow) {
  const alias = projectAliases[row.name];
  return fallbackPortfolioData.projects.find(
    (project) =>
      project.id === row.slug ||
      project.id === alias ||
      project.title === row.name,
  );
}

function mapProject(row: ProjectRow, index: number): PortfolioProject {
  const fallback =
    projectFallback(row) ?? fallbackPortfolioData.projects[index];
  const id = row.slug ?? fallback?.id ?? `project-${index + 1}`;
  const image = row.image_key
    ? `/images/${row.image_key}.png`
    : (fallback?.image ?? `/images/${id}.png`);
  const tones: ProjectTone[] = ["paper", "ink", "signal"];

  return {
    id,
    title: row.name,
    eyebrow: row.eyebrow ?? fallback?.eyebrow ?? "Product work",
    summary:
      row.short_description ??
      row.full_description ??
      fallback?.summary ??
      "A product shaped from problem definition through delivery.",
    impact:
      row.impact ??
      row.full_description ??
      fallback?.impact ??
      "Designed and engineered as a dependable end-to-end experience.",
    role: row.contribution ?? fallback?.role ?? "Product engineering",
    year: row.year_label ?? fallback?.year ?? "Recent work",
    image,
    imageHeight: fallback?.imageHeight ?? 1674,
    imageAlt:
      row.image_alt ?? fallback?.imageAlt ?? `${row.name} product interface`,
    href: row.live_link ?? fallback?.href ?? "#contact",
    github:
      row.github_link ??
      fallback?.github ??
      fallbackPortfolioData.profile.github,
    tags:
      strings(row.tags).length > 0 ? strings(row.tags) : (fallback?.tags ?? []),
    tone: fallback?.tone ?? tones[index % tones.length] ?? "paper",
  };
}

function mapCredential(
  row: CertificateRow,
  index: number,
): PortfolioCredential {
  const key =
    row.preview_key ?? row.document_key ?? credentialAliases[row.name];
  const fallback =
    fallbackPortfolioData.credentials.find((credential) =>
      credential.image.includes(`/${key}.png`),
    ) ?? fallbackPortfolioData.credentials[index];

  return {
    name: row.name,
    issuer: row.issuer ?? fallback?.issuer ?? "Credential",
    category: row.category ?? fallback?.category ?? "Milestone",
    href: key ? `/documents/certificates/${key}.pdf` : (fallback?.href ?? "#"),
    image: key ? `/images/certificates/${key}.png` : (fallback?.image ?? ""),
    imageWidth: fallback?.imageWidth ?? 1754,
    imageHeight: fallback?.imageHeight ?? 1241,
    imageAlt:
      row.image_alt ??
      fallback?.imageAlt ??
      `${row.name} certificate awarded to Jayant Goyal`,
  };
}

function mapProfile(
  hero: HeroRow,
  contact: ContactRow | null,
): PortfolioProfile {
  const fallback = fallbackPortfolioData.profile;
  const socials = socialLinks(contact?.socials);
  return {
    ...fallback,
    name: hero.name,
    displayName: hero.display_name ?? fallback.displayName,
    role: hero.role,
    headline: hero.headline ?? fallback.headline,
    introduction: hero.blurb ?? fallback.introduction,
    focus: hero.tagline ?? fallback.focus,
    currentRole: hero.current_title ?? fallback.currentRole,
    availability: hero.availability ?? fallback.availability,
    resume: hero.resume_url ?? fallback.resume,
    location: contact?.location ?? hero.location ?? fallback.location,
    email: contact?.email ?? fallback.email,
    phone: contact?.phone ?? fallback.phone,
    github: socialHref(socials, "github", fallback.github),
    linkedin: socialHref(socials, "linkedin", fallback.linkedin),
    instagram: socialHref(socials, "instagram", fallback.instagram),
  };
}

function mapAbout(row: AboutRow): PortfolioAbout {
  const fallback = fallbackPortfolioData.about;
  const mappedStory = strings(row.story);
  const mappedFacts = personalFacts(row.personal);
  const mappedHighlights = strings(row.highlights);
  return {
    headline: row.headline ?? fallback.headline,
    objective: row.objective ?? row.summary ?? fallback.objective,
    lead: row.summary ?? fallback.lead,
    story: mappedStory,
    facts: mappedFacts,
    highlights: mappedHighlights,
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
      const fallback = fallbackPortfolioData.sectionContent[key];
      return [
        key,
        {
          eyebrow: row?.eyebrow ?? fallback.eyebrow,
          headline: row?.headline ?? fallback.headline,
          accent: row?.accent ?? fallback.accent,
          description: row?.description ?? fallback.description,
          supportingText: row?.supporting_text ?? fallback.supportingText,
        },
      ];
    }),
  ) as PortfolioSectionContentMap;
}

export const getEditorialPortfolioData = cache(
  async (): Promise<{
    data: PortfolioEditorialData;
    source: "database" | "fallback";
  }> => {
    try {
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
          .select("*")
          .eq("is_visible", true)
          .maybeSingle(),
        supabase
          .schema("portfolio")
          .from("about")
          .select("*")
          .eq("is_visible", true)
          .maybeSingle(),
        supabase
          .schema("portfolio")
          .from("education")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order"),
        supabase
          .schema("portfolio")
          .from("experience")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order"),
        supabase
          .schema("portfolio")
          .from("skill_categories")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order"),
        supabase
          .schema("portfolio")
          .from("skills")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order"),
        supabase
          .schema("portfolio")
          .from("projects")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order"),
        supabase
          .schema("portfolio")
          .from("certificates")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order"),
        supabase
          .schema("portfolio")
          .from("contact")
          .select("*")
          .eq("is_visible", true)
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
            "section_key, eyebrow, headline, accent, description, supporting_text",
          )
          .eq("is_visible", true)
          .order("sort_order"),
      ]);

      const errors = [
        heroResult.error,
        aboutResult.error,
        educationResult.error,
        experienceResult.error,
        categoriesResult.error,
        skillsResult.error,
        projectsResult.error,
        certificatesResult.error,
        contactResult.error,
        navigationResult.error,
        sectionContentResult.error,
      ].filter(Boolean);

      if (errors.length > 0 || !heroResult.data || !aboutResult.data) {
        throw new Error(
          errors.map((error) => error?.message).join("; ") ||
            "Core portfolio content is missing",
        );
      }

      const heroRow = heroResult.data as HeroRow;
      const projectRows = (projectsResult.data ?? []) as ProjectRow[];
      const categories = (categoriesResult.data ?? []) as SkillCategoryRow[];
      const skillRows = (skillsResult.data ?? []) as SkillRow[];
      const aboutRow = aboutResult.data as AboutRow;
      const databasePrinciples = principles(aboutRow.principles);

      return {
        source: "database",
        data: {
          profile: mapProfile(
            heroRow,
            (contactResult.data as ContactRow | null) ?? null,
          ),
          about: mapAbout(aboutRow),
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
            description:
              category.description ??
              "Tools and practices applied in shipped product work.",
            items: skillRows
              .filter((skill) => skill.category_id === category.id)
              .map((skill) => ({
                name: skill.name,
                proficiency: proficiency(skill.proficiency),
                evidence: skill.evidence ?? undefined,
                isFeatured: skill.is_featured ?? true,
              })),
          })),
          projects: projectRows.map(mapProject),
          credentials: (
            (certificatesResult.data ?? []) as CertificateRow[]
          ).map(mapCredential),
          principles: databasePrinciples,
        },
      };
    } catch (error) {
      console.error(
        "Unable to load the editorial Portfolio from Supabase; using the verified fallback.",
        error instanceof Error ? error.message : "Unknown error",
      );
      return { data: fallbackPortfolioData, source: "fallback" };
    }
  },
);

export const getPortfolioShellData = cache(async () => {
  try {
    const supabase = await createSupabaseServerClient();
    const [heroResult, navigationResult] = await Promise.all([
      supabase
        .schema("portfolio")
        .from("hero")
        .select("name, display_name")
        .eq("is_visible", true)
        .maybeSingle(),
      supabase
        .schema("portfolio")
        .from("nav_items")
        .select("section_id, label, note")
        .eq("is_visible", true)
        .order("sort_order"),
    ]);

    if (heroResult.error || navigationResult.error || !heroResult.data) {
      throw new Error(
        heroResult.error?.message ??
          navigationResult.error?.message ??
          "Portfolio shell content is missing",
      );
    }

    return {
      brandLabel:
        (heroResult.data as { display_name?: string | null }).display_name ??
        fallbackPortfolioData.profile.displayName,
      navigation: mapNavigation(
        (navigationResult.data ?? []) as NavigationRow[],
      ),
    };
  } catch (error) {
    console.error(
      "Unable to load the Portfolio shell from Supabase; using the verified fallback.",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      brandLabel: fallbackPortfolioData.profile.displayName,
      navigation: fallbackPortfolioData.navigation,
    };
  }
});
