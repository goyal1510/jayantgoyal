import type { Metadata } from "next"
import PortfolioClient from "./client"

export const metadata: Metadata = {
  title: "Portfolio | Jayant Goyal",
  description: "Welcome to Jayant Goyal's portfolio showcasing projects and skills.",
}

export default function Page() {
  return <PortfolioClient />
}
