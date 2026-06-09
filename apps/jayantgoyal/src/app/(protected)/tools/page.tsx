import type { Metadata } from "next"
import ToolsPageClient from "./client"

export const metadata: Metadata = {
  title: "Developer Tools",
  description: "99+ utilities for developers and power users including generators, converters, formatters, and more.",
}

export default function ToolsPage() {
  return <ToolsPageClient />
}
