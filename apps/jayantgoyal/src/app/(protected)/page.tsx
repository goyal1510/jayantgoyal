import type { Metadata } from "next"
import PortfolioClient from "./client"

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Jayant Goyal's portfolio — full-stack developer showcasing projects, skills, experience, and certifications.",
  openGraph: {
    title: "Jayant Goyal — Portfolio",
    description: "Full-stack developer showcasing projects, skills, experience, and certifications.",
  },
}

export default function Page() {
  return <PortfolioClient />
}
