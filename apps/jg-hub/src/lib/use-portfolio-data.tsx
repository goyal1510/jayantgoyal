'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

import type { PortfolioData, PortfolioProfileKey } from "@/lib/portfolio-data"
import {
  getPortfolioData,
  normalizeHost,
  resolvePortfolioProfile,
} from "@/lib/portfolio-data"

type PortfolioContextValue = {
  data: PortfolioData
  profile: PortfolioProfileKey
  host?: string
}

const PortfolioDataContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioDataProvider({
  profile,
  host,
  children,
}: {
  profile: PortfolioProfileKey
  host?: string
  children: ReactNode
}) {
  const normalizedHost = normalizeHost(host)
  const resolvedProfile = useMemo(
    () => resolvePortfolioProfile(normalizedHost || profile),
    [normalizedHost, profile]
  )
  const resolvedData = useMemo(
    () => getPortfolioData(normalizedHost || resolvedProfile),
    [normalizedHost, resolvedProfile]
  )

  return (
    <PortfolioDataContext.Provider
      value={{ data: resolvedData, profile: resolvedProfile, host: normalizedHost }}
    >
      {children}
    </PortfolioDataContext.Provider>
  )
}

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
  const data = context?.data ?? getPortfolioData(resolvedHost)
  const profile = context?.profile ?? resolvePortfolioProfile(resolvedHost)

  return {
    data,
    profile,
    host: resolvedHost,
  }
}
