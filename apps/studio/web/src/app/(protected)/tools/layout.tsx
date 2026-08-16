import type { ReactNode } from "react"
import { headers } from "next/headers"
import { ToolUsageShell } from "@/components/tools/tool-usage-shell"
import { ToolSeoContent } from "@/components/tools/tool-seo-content"
import { normalizePathname, SITE_URL } from "@/lib/seo/config"

export default async function ToolsLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const pathname = normalizePathname(headerStore.get("x-pathname"))

  return (
    <ToolUsageShell>
      {children}
      <ToolSeoContent pathname={pathname} baseUrl={SITE_URL} />
    </ToolUsageShell>
  )
}
