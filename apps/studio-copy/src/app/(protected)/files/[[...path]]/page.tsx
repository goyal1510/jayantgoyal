import type { Metadata } from "next";
import FilesPageClient from "./client";

export const metadata: Metadata = {
  title: "File Manager",
  description:
    "Cloud file manager with folders, upload, download, and file preview support.",
};

export default function FilesPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  return <FilesPageClient params={params} />;
}
