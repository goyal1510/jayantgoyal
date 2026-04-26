import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jayant Goyal — Full-Stack Developer",
    short_name: "Jayant Goyal",
    description: "Full-stack developer portfolio with 99+ dev tools, games, and utilities.",
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
