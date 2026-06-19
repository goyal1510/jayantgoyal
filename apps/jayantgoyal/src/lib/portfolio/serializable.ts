/**
 * Serializable Portfolio Data
 * Plain objects that can be passed from Server to Client Components
 * Icons are stored as string keys (resolved to components on client)
 */

import type { jayantPortfolioData } from "@/lib/portfolio/profiles/jayant-portfolio-data"

type LegacyData = typeof jayantPortfolioData

/**
 * Serializable portfolio data structure
 * All icons are string keys, not React components
 */
export interface SerializablePortfolioData {
  NAV_ITEMS: {
    id: string
    label: string
    icon_key: string
    color: string
  }[]
  HERO: {
    name: string
    role: string
    tagline: string
    blurb: string
    location: string
  }
  ABOUT: {
    summary: string
    personal: { label: string; value: string }[]
    highlights: string[]
  }
  EDUCATION: {
    school: string
    degree: string
    period: string
    location: string
    detail: string
  }[]
  EXPERIENCE: {
    company: string
    role: string
    period: string
    location: string
    summary: string
    bullets: string[]
  }[]
  SKILL_SETS: {
    title: string
    icon_key: string
    color: string
    items: { name: string; icon_key: string; level: number }[]
  }[]
  TECH_ICONS: {
    icon_key: string
    name: string
    color: string
  }[]
  PROJECTS: {
    name: string
    shortDescription: string
    fullDescription: string
    imageLight: string
    imageDark: string
    tags: string[]
    githubLink: string
    liveLink: string
  }[]
  CERTIFICATES: {
    name: string
    path: string
    description: string
    category: string
    issuer: string
  }[]
  CONTACT: {
    email: string
    phone: string
    location: string
    socials: {
      label: string
      href: string
      icon_key: string
      color: string
    }[]
  }
}

/**
 * Extract icon name from Lucide component
 * Lucide icons have displayName or name property
 */
function getIconKey(icon: { displayName?: string; name?: string }): string {
  return icon.displayName || icon.name || "Code2"
}

/**
 * Transform legacy hardcoded data to serializable format
 * Converts icon components to string keys
 */
export function transformLegacyToSerializable(data: LegacyData): SerializablePortfolioData {
  return {
    NAV_ITEMS: data.NAV_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      icon_key: getIconKey(item.icon),
      color: item.color,
    })),
    HERO: {
      name: data.HERO.name,
      role: data.HERO.role,
      tagline: data.HERO.tagline,
      blurb: data.HERO.blurb,
      location: data.HERO.location,
    },
    ABOUT: {
      summary: data.ABOUT.summary,
      personal: [...data.ABOUT.personal],
      highlights: [...data.ABOUT.highlights],
    },
    EDUCATION: data.EDUCATION.map((edu) => ({
      school: edu.school,
      degree: edu.degree,
      period: edu.period,
      location: edu.location,
      detail: edu.detail,
    })),
    EXPERIENCE: data.EXPERIENCE.map((exp) => ({
      company: exp.company,
      role: exp.role,
      period: exp.period,
      location: exp.location,
      summary: exp.summary,
      bullets: [...exp.bullets],
    })),
    SKILL_SETS: data.SKILL_SETS.map((set) => ({
      title: set.title,
      icon_key: getIconKey(set.icon),
      color: set.color,
      items: set.items.map((item) => ({
        name: item.name,
        icon_key: item.name,
        level: item.level,
      })),
    })),
    TECH_ICONS: data.TECH_ICONS.map((icon) => ({
      icon_key: getIconKey(icon.icon),
      name: icon.name,
      color: icon.color,
    })),
    PROJECTS: data.PROJECTS.map((proj) => ({
      name: proj.name,
      shortDescription: proj.shortDescription,
      fullDescription: proj.fullDescription,
      imageLight: proj.imageLight,
      imageDark: proj.imageDark,
      tags: [...proj.tags],
      githubLink: proj.githubLink,
      liveLink: proj.liveLink,
    })),
    CERTIFICATES: data.CERTIFICATES.map((cert) => ({
      name: cert.name,
      path: cert.path,
      description: cert.description,
      category: cert.category,
      issuer: cert.issuer,
    })),
    CONTACT: {
      email: data.CONTACT.email,
      phone: data.CONTACT.phone,
      location: data.CONTACT.location,
      socials: data.CONTACT.socials.map((social) => ({
        label: social.label,
        href: social.href,
        icon_key: getIconKey(social.icon),
        color: social.color,
      })),
    },
  }
}
