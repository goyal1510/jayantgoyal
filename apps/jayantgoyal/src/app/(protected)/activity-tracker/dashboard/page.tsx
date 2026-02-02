import type { Metadata } from "next"
import DashboardClient from "./client"

export const metadata: Metadata = {
  title: "Activity Dashboard | Jayant",
  description: "View your activity tracker dashboard.",
}

export default function DashboardPage() {
  return <DashboardClient />
}
