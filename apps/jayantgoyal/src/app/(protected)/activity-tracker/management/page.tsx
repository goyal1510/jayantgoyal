import type { Metadata } from "next"
import ManagementClient from "./client"

export const metadata: Metadata = {
  title: "Activity Management | Jayant Goyal",
  description: "Manage your tracked activities.",
}

export default function ManagementPage() {
  return <ManagementClient />
}
