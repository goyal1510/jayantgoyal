/**
 * Portfolio Icon Mapping
 * Maps string keys from database to Lucide React icon components
 */

import {
  Award,
  BrainCog,
  BriefcaseBusiness,
  Code2,
  Github,
  Home,
  Instagram,
  Linkedin,
  Mail,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react"

/**
 * Map of icon string keys to Lucide icon components
 * Add new icons here as needed
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  BrainCog,
  BriefcaseBusiness,
  Code2,
  Github,
  Home,
  Instagram,
  Linkedin,
  Mail,
  Sparkles,
  User,
} as const

/**
 * Get a Lucide icon component by its string key
 * Returns undefined if the key is not found
 *
 * @param key - The icon key string (e.g., "Github", "Code2")
 * @returns The Lucide icon component or undefined
 *
 * @example
 * const Icon = getIconComponent("Github")
 * if (Icon) {
 *   return <Icon className="size-5" />
 * }
 */
export function getIconComponent(key: string): LucideIcon | undefined {
  return ICON_MAP[key]
}

/**
 * Get a Lucide icon component by its string key, with a fallback
 * Returns the fallback icon if the key is not found
 *
 * @param key - The icon key string (e.g., "Github", "Code2")
 * @param fallback - The fallback icon component to use if key not found
 * @returns The Lucide icon component
 *
 * @example
 * const Icon = getIconComponentWithFallback("Unknown", Code2)
 * return <Icon className="size-5" />
 */
export function getIconComponentWithFallback(
  key: string,
  fallback: LucideIcon
): LucideIcon {
  return ICON_MAP[key] ?? fallback
}

/**
 * Check if an icon key exists in the icon map
 *
 * @param key - The icon key string to check
 * @returns true if the icon exists in the map
 */
export function hasIcon(key: string): boolean {
  return key in ICON_MAP
}

/**
 * Get all available icon keys
 *
 * @returns Array of available icon key strings
 */
export function getAvailableIconKeys(): string[] {
  return Object.keys(ICON_MAP)
}
