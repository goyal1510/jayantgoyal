import type { Metadata } from "next"
import ToolsClient from "./client"
import { buildPublicPageMetadata } from "@/lib/seo/config"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Developer Tools",
  description: "99+ utilities for developers and power users including generators, converters, formatters, and more.",
  pathname: "/tools",
})

export default function ToolsPage() {
  return <ToolsClient />
}
