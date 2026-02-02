import type { Metadata } from "next"
import FilesPageClient from "./client"

export const metadata: Metadata = {
  title: "Files | Jayant",
  description: "Browse and manage your files.",
}

export default function FilesPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  return <FilesPageClient params={params} />
}
