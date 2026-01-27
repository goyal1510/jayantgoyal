/**
 * Portfolio Database Access Layer
 * Functions for fetching portfolio data from Supabase
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
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
  TransformedPortfolioData,
  HeroData,
  AboutData,
  EducationData,
  ExperienceData,
  SkillSetData,
  TechIconData,
  ProjectData,
  CertificateData,
  ContactData,
  NavItemData,
} from "./database.types"

// ============================================================================
// Individual Fetch Functions
// ============================================================================

export async function getHero(): Promise<HeroRow | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("hero")
    .select("*")
    .single()

  if (error) {
    console.error("Error fetching hero:", error)
    return null
  }
  return data
}

export async function getAbout(): Promise<AboutRow | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("about")
    .select("*")
    .single()

  if (error) {
    console.error("Error fetching about:", error)
    return null
  }
  return data
}

export async function getEducation(): Promise<EducationRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("education")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching education:", error)
    return []
  }
  return data ?? []
}

export async function getExperience(): Promise<ExperienceRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("experience")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching experience:", error)
    return []
  }
  return data ?? []
}

export async function getSkillCategories(): Promise<SkillCategoryRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("skill_categories")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching skill categories:", error)
    return []
  }
  return data ?? []
}

export async function getSkills(): Promise<SkillRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching skills:", error)
    return []
  }
  return data ?? []
}

export async function getSkillCategoriesWithSkills(): Promise<SkillCategoryWithSkills[]> {
  const [categories, skills] = await Promise.all([
    getSkillCategories(),
    getSkills(),
  ])

  return categories.map((category) => ({
    ...category,
    skills: skills.filter((skill) => skill.category_id === category.id),
  }))
}

export async function getTechIcons(): Promise<TechIconRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("tech_icons")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching tech icons:", error)
    return []
  }
  return data ?? []
}

export async function getProjects(): Promise<ProjectRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }
  return data ?? []
}

export async function getCertificates(): Promise<CertificateRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching certificates:", error)
    return []
  }
  return data ?? []
}

export async function getContact(): Promise<ContactRow | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("contact")
    .select("*")
    .single()

  if (error) {
    console.error("Error fetching contact:", error)
    return null
  }
  return data
}

export async function getNavItems(): Promise<NavItemRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .schema("portfolio")
    .from("nav_items")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching nav items:", error)
    return []
  }
  return data ?? []
}

// ============================================================================
// Composite Fetch Function
// ============================================================================

/**
 * Fetches all portfolio data in parallel
 * Use this for initial page load to minimize round trips
 */
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
  ])

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
  }
}

// ============================================================================
// Transform Functions (Database -> Component Format)
// ============================================================================

function transformHero(hero: HeroRow | null): HeroData {
  return {
    name: hero?.name ?? "",
    role: hero?.role ?? "",
    tagline: hero?.tagline ?? "",
    blurb: hero?.blurb ?? "",
    location: hero?.location ?? "",
  }
}

function transformAbout(about: AboutRow | null): AboutData {
  return {
    summary: about?.summary ?? "",
    personal: about?.personal ?? [],
    highlights: about?.highlights ?? [],
  }
}

function transformEducation(education: EducationRow[]): EducationData[] {
  return education.map((edu) => ({
    school: edu.school,
    degree: edu.degree,
    period: edu.period,
    location: edu.location ?? "",
    detail: edu.detail ?? "",
  }))
}

function transformExperience(experience: ExperienceRow[]): ExperienceData[] {
  return experience.map((exp) => ({
    company: exp.company,
    role: exp.role,
    period: exp.period,
    location: exp.location ?? "",
    summary: exp.summary ?? "",
    bullets: exp.bullets ?? [],
  }))
}

function transformSkillSets(categories: SkillCategoryWithSkills[]): SkillSetData[] {
  return categories.map((cat) => ({
    title: cat.title,
    icon_key: cat.icon_key,
    color: cat.color ?? "",
    items: cat.skills.map((skill) => ({
      name: skill.name,
      level: skill.level ?? 0,
    })),
  }))
}

function transformTechIcons(icons: TechIconRow[]): TechIconData[] {
  return icons.map((icon) => ({
    icon_key: icon.icon_key,
    name: icon.name,
    color: icon.color ?? "",
  }))
}

function transformProjects(projects: ProjectRow[]): ProjectData[] {
  return projects.map((proj) => ({
    name: proj.name,
    shortDescription: proj.short_description ?? "",
    fullDescription: proj.full_description ?? "",
    imageLight: proj.image_light ?? "",
    imageDark: proj.image_dark ?? "",
    tags: proj.tags ?? [],
    githubLink: proj.github_link ?? "",
    liveLink: proj.live_link ?? "",
  }))
}

function transformCertificates(certificates: CertificateRow[]): CertificateData[] {
  return certificates.map((cert) => ({
    name: cert.name,
    path: cert.path,
    description: cert.description ?? "",
    category: cert.category ?? "",
    issuer: cert.issuer ?? "",
  }))
}

function transformContact(contact: ContactRow | null): ContactData {
  return {
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    location: contact?.location ?? "",
    socials: contact?.socials ?? [],
  }
}

function transformNavItems(navItems: NavItemRow[]): NavItemData[] {
  return navItems.map((item) => ({
    id: item.section_id,
    label: item.label,
    icon_key: item.icon_key,
    color: item.color ?? "",
  }))
}

/**
 * Transforms raw database data to component-compatible format
 */
export function transformPortfolioData(
  data: PortfolioDatabaseData
): TransformedPortfolioData {
  return {
    NAV_ITEMS: transformNavItems(data.navItems),
    HERO: transformHero(data.hero),
    ABOUT: transformAbout(data.about),
    EDUCATION: transformEducation(data.education),
    EXPERIENCE: transformExperience(data.experience),
    SKILL_SETS: transformSkillSets(data.skillCategories),
    TECH_ICONS: transformTechIcons(data.techIcons),
    PROJECTS: transformProjects(data.projects),
    CERTIFICATES: transformCertificates(data.certificates),
    CONTACT: transformContact(data.contact),
  }
}

/**
 * Fetches and transforms all portfolio data for component usage
 */
export async function getTransformedPortfolioData(): Promise<TransformedPortfolioData> {
  const rawData = await getFullPortfolioData()
  return transformPortfolioData(rawData)
}
