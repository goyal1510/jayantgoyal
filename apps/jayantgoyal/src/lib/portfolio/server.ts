import { headers } from "next/headers"

import {
  normalizeHost,
  resolvePortfolioProfile,
} from "@/lib/portfolio/data"
import { getTransformedPortfolioData } from "@/lib/portfolio/database"
import type { TransformedPortfolioData } from "@/lib/portfolio/database.types"
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
 */
async function getPortfolioDataWithFallback(host?: string | null): Promise<SerializablePortfolioData> {
  if (!USE_DATABASE) {
    return transformLegacyToSerializable(jayantPortfolioData)
  }

  try {
    const dbData = await getTransformedPortfolioData()

    // Check if we got valid data (hero name exists)
    if (dbData.HERO.name) {
      // Database data is already serializable (uses icon_key strings)
      return dbData as SerializablePortfolioData
    }

    // Fall back to legacy data if database returned empty
    console.warn("Database returned empty data, falling back to hardcoded data")
    return transformLegacyToSerializable(jayantPortfolioData)
  } catch (error) {
    console.error("Error fetching portfolio data from database:", error)
    return transformLegacyToSerializable(jayantPortfolioData)
  }
}

/**
 * Get portfolio data using request headers
 * Fetches from database with fallback to hardcoded data
 */
export async function getPortfolioDataFromHeaders() {
  const host = (await headers()).get("host")
  const normalizedHost = normalizeHost(host)

  const data = await getPortfolioDataWithFallback(host)

  return {
    data,
    profile: resolvePortfolioProfile(host),
    host: normalizedHost || undefined,
  }
}

/**
 * Get portfolio data without headers (for static generation)
 * Fetches from database with fallback to hardcoded data
 */
export async function getPortfolioDataStatic() {
  const data = await getPortfolioDataWithFallback()

  return {
    data,
    profile: resolvePortfolioProfile(),
  }
}
