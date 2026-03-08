'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"

import type { PortfolioProfileKey } from "@/lib/portfolio/data"
import { normalizeHost, resolvePortfolioProfile } from "@/lib/portfolio/data"
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable"
import { transformLegacyToSerializable } from "@/lib/portfolio/serializable"
import { jayantPortfolioData } from "@/lib/portfolio/profiles/jayant-portfolio-data"

export type PortfolioDataSource = "database" | "hardcoded"

type PortfolioContextValue = {
  data: SerializablePortfolioData
  profile: PortfolioProfileKey
  host?: string
  source: PortfolioDataSource
}

const PortfolioDataContext = createContext<PortfolioContextValue | null>(null)

/**
 * Provider component for portfolio data
 * Data is passed from server component (fetched from database)
 */
export function PortfolioDataProvider({
  data,
  profile,
  host,
  source,
  children,
}: {
  data: SerializablePortfolioData
  profile: PortfolioProfileKey
  host?: string
  source: PortfolioDataSource
  children: ReactNode
}) {
  const normalizedHost = normalizeHost(host)

  return (
    <PortfolioDataContext.Provider
      value={{ data, profile, host: normalizedHost, source }}
    >
      {children}
    </PortfolioDataContext.Provider>
  )
}

/**
 * Hook to access portfolio data in client components
 * Returns serializable data (icons are string keys)
 */
export function usePortfolioData(initialHost?: string) {
  const context = useContext(PortfolioDataContext)
  const [host, setHost] = useState<string | undefined>(
    context?.host ?? initialHost
  )

  useEffect(() => {
    if (!host && typeof window !== "undefined") {
      setHost(window.location.hostname)
    }
  }, [host])

  const resolvedHost = host ?? context?.host

  // Use context data if available (from server), otherwise fall back to transformed legacy
  const data = context?.data ?? transformLegacyToSerializable(jayantPortfolioData)
  const profile = context?.profile ?? resolvePortfolioProfile(resolvedHost)
  const source: PortfolioDataSource = context?.source ?? "hardcoded"

  return {
    data,
    profile,
    host: resolvedHost,
    source,
  }
}
