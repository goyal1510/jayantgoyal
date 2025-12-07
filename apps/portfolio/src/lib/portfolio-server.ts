import { headers } from "next/headers"

import {
  getPortfolioData,
  normalizeHost,
  resolvePortfolioProfile,
} from "@/lib/portfolio-data"

export async function getPortfolioDataFromHeaders() {
  const host = (await headers()).get("host")
  const normalizedHost = normalizeHost(host)

  return {
    data: getPortfolioData(host),
    profile: resolvePortfolioProfile(host),
    host: normalizedHost || undefined,
  }
}
