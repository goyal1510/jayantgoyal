import type { Metadata } from "next"

import ToolWorkspacePageClient from "./client"

export const metadata: Metadata = {
  title: "Tool Workspace",
  description: "Manage saved developer tool outputs, favorites, collections, and exports.",
}

export default function ToolWorkspacePage() {
  return <ToolWorkspacePageClient />
}
