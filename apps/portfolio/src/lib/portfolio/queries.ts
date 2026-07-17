import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  HeroRow,
  AboutRow,
  EducationRow,
  ExperienceRow,
  SkillCategoryRow,
  SkillRow,
  TechIconRow,
  ProjectRow,
  CertificateRow,
  ContactRow,
  NavItemRow,
  SkillCategoryWithSkills,
  PortfolioDatabaseData,
} from "./database.types";

export async function getHero(): Promise<HeroRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("hero")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching hero:", error);
    return null;
  }
  return data;
}

export async function getAbout(): Promise<AboutRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("about")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching about:", error);
    return null;
  }
  return data;
}

export async function getEducation(): Promise<EducationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("education")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching education:", error);
    return [];
  }
  return data ?? [];
}

export async function getExperience(): Promise<ExperienceRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("experience")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching experience:", error);
    return [];
  }
  return data ?? [];
}

export async function getSkillCategories(): Promise<SkillCategoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("skill_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching skill categories:", error);
    return [];
  }
  return data ?? [];
}

export async function getSkills(): Promise<SkillRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching skills:", error);
    return [];
  }
  return data ?? [];
}

export async function getSkillCategoriesWithSkills(): Promise<
  SkillCategoryWithSkills[]
> {
  const [categories, skills] = await Promise.all([
    getSkillCategories(),
    getSkills(),
  ]);

  return categories.map((category) => ({
    ...category,
    skills: skills.filter((skill) => skill.category_id === category.id),
  }));
}

export async function getTechIcons(): Promise<TechIconRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("tech_icons")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching tech icons:", error);
    return [];
  }
  return data ?? [];
}

export async function getProjects(): Promise<ProjectRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return data ?? [];
}

export async function getCertificates(): Promise<CertificateRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }
  return data ?? [];
}

export async function getContact(): Promise<ContactRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("contact")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching contact:", error);
    return null;
  }
  return data;
}

export async function getNavItems(): Promise<NavItemRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .from("nav_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching nav items:", error);
    return [];
  }
  return data ?? [];
}

export async function getFullPortfolioData(): Promise<PortfolioDatabaseData> {
  const [
    hero,
    about,
    education,
    experience,
    skillCategories,
    techIcons,
    projects,
    certificates,
    contact,
    navItems,
  ] = await Promise.all([
    getHero(),
    getAbout(),
    getEducation(),
    getExperience(),
    getSkillCategoriesWithSkills(),
    getTechIcons(),
    getProjects(),
    getCertificates(),
    getContact(),
    getNavItems(),
  ]);

  return {
    hero,
    about,
    education,
    experience,
    skillCategories,
    techIcons,
    projects,
    certificates,
    contact,
    navItems,
  };
}
