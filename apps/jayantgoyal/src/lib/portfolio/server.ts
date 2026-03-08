import { cache } from "react"
import { headers } from "next/headers"

import {
  normalizeHost,
  resolvePortfolioProfile,
} from "@/lib/portfolio/data"
import { getTransformedPortfolioData } from "@/lib/portfolio/database"
import { transformLegacyToSerializable, type SerializablePortfolioData } from "@/lib/portfolio/serializable"
import { jayantPortfolioData } from "@/lib/portfolio/profiles/jayant-portfolio-data"

/**
 * Whether to use the database for portfolio data
 * Set to true once the database is seeded and ready
 */
const USE_DATABASE = true

/**
 * Get portfolio data from database with fallback to hardcoded data
 * Returns serializable data (no React components - icons are string keys)
 * Wrapped in React cache() for request-level deduplication
 */
const getPortfolioDataWithFallback = cache(async (): Promise<{ data: SerializablePortfolioData; source: "database" | "hardcoded" }> => {
  if (!USE_DATABASE) {
    return { data: transformLegacyToSerializable(jayantPortfolioData), source: "hardcoded" }
  }

  try {
    const dbData = await getTransformedPortfolioData()

    // Check if we got valid data (hero name exists)
    if (dbData.HERO.name) {
      // Database data is already serializable (uses icon_key strings)
      return { data: dbData as SerializablePortfolioData, source: "database" }
    }

    // Fall back to legacy data if database returned empty
    console.warn("Database returned empty data, falling back to hardcoded data")
    return { data: transformLegacyToSerializable(jayantPortfolioData), source: "hardcoded" }
  } catch (error) {
    console.error("Error fetching portfolio data from database:", error)
    return { data: transformLegacyToSerializable(jayantPortfolioData), source: "hardcoded" }
  }
})

/**
 * Get portfolio data using request headers
 * Fetches from database with fallback to hardcoded data
 */
export async function getPortfolioDataFromHeaders() {
  const host = (await headers()).get("host")
  const normalizedHost = normalizeHost(host)

  const { data, source } = await getPortfolioDataWithFallback()

  return {
    data,
    source,
    profile: resolvePortfolioProfile(host),
    host: normalizedHost || undefined,
  }
}

/**
 * Get portfolio data without headers (for static generation)
 * Fetches from database with fallback to hardcoded data
 */
export async function getPortfolioDataStatic() {
  const { data, source } = await getPortfolioDataWithFallback()

  return {
    data,
    source,
    profile: resolvePortfolioProfile(),
  }
}
