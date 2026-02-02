import type { Metadata } from "next"
import ChangelogPageClient from "./client"

export const metadata: Metadata = {
  title: "File Changelog | Jayant",
  description: "View file change history.",
}

export default function ChangelogPage() {
  return <ChangelogPageClient />
}
