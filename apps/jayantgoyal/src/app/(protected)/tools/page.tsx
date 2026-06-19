import type { Metadata } from "next"
import ToolsClient from "./client"

export const metadata: Metadata = {
  title: "Developer Tools",
  description: "99+ utilities for developers and power users including generators, converters, formatters, and more.",
}

export default function ToolsPage() {
  return <ToolsClient />
}
