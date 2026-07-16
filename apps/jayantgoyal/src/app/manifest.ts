import type { MetadataRoute } from "next"
import { headers } from "next/headers"

import { isStudioHost } from "@/lib/platform/surface"
import {
  STUDIO_SITE_DESCRIPTION,
  STUDIO_SITE_NAME,
} from "@/lib/seo/config"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const studio = isStudioHost((await headers()).get("host"))
  return {
    name: studio ? STUDIO_SITE_NAME : "JG",
    short_name: studio ? "JG Studio" : "JG",
    description: studio
      ? STUDIO_SITE_DESCRIPTION
      : "A unified platform by Jayant Goyal — portfolio, 99+ developer tools, games, file manager, messenger, and more. Built with Next.js, React, TypeScript, and Supabase.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/assets/Jayant_favicon_io/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/Jayant_favicon_io/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
