import type { ReactNode } from "react"
import { ToolUsageShell } from "@/components/tools/tool-usage-shell"

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <ToolUsageShell>{children}</ToolUsageShell>
}
