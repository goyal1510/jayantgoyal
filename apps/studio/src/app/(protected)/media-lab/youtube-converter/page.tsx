import type { Metadata } from "next";
import { Youtube } from "lucide-react";

import { WorkspaceHeader } from "@repo/ui/workspace-header";

import { buildPublicPageMetadata } from "@/lib/seo/config";

import YouTubeConverterClient from "./client";

const pathname = "/media-lab/youtube-converter";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "YouTube Converter",
  description:
    "Create temporary MP3 or MP4 downloads from YouTube media you own or are authorized to download.",
  pathname,
});

export default function YouTubeConverterPage() {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Youtube}
        title="YouTube Converter"
        description="Create private, temporary MP3 or MP4 downloads from authorized YouTube videos and Shorts."
        toneClassName="border-red-500/25 bg-red-500/[0.07] text-red-950 dark:text-red-100"
      />
      <YouTubeConverterClient />
    </div>
  );
}
