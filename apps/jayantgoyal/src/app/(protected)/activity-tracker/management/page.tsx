import type { Metadata } from "next"
import ManagementClient from "./client"

export const metadata: Metadata = {
  title: "Activity Management | Jayant",
  description: "Manage your tracked activities.",
}

export default function ManagementPage() {
  return <ManagementClient />
}
