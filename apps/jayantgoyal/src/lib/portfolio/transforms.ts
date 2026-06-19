import type {
  HeroRow,
  AboutRow,
  EducationRow,
  ExperienceRow,
  SkillCategoryWithSkills,
  TechIconRow,
  ProjectRow,
  CertificateRow,
  ContactRow,
  NavItemRow,
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
      icon_key: skill.icon_key,
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
