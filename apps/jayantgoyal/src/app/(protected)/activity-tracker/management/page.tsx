import type { Metadata } from "next"
import ManagementClient from "./client"

export const metadata: Metadata = {
  title: "Activity Management",
  description: "Manage your activity categories, edit entries, and configure tracking settings.",
}

export default function ManagementPage() {
  return <ManagementClient />
}
