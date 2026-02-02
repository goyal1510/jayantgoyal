import type { Metadata } from "next"
import PortfolioClient from "./client"

export const metadata: Metadata = {
  title: "Jayant",
  description: "Welcome to Jayant's portfolio showcasing projects and skills.",
}

export default function Page() {
  return <PortfolioClient />
}
