import type { ReactNode } from "react"
import { headers } from "next/headers"
import { ToolUsageShell } from "@/components/tools/tool-usage-shell"
import { ToolSeoContent } from "@/components/tools/tool-seo-content"
import { normalizePathname, SITE_URL } from "@/lib/seo/config"
import { isStudioHost } from "@/lib/platform/surface"
import { STUDIO_URL } from "@/lib/platform/urls"

export default async function ToolsLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const pathname = normalizePathname(headerStore.get("x-pathname"))
  const baseUrl = isStudioHost(headerStore.get("host")) ? STUDIO_URL : SITE_URL

  return (
    <ToolUsageShell>
      {children}
      <ToolSeoContent pathname={pathname} baseUrl={baseUrl} />
    </ToolUsageShell>
  )
}
