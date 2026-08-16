import type { Metadata } from "next"
import TrackerClient from "./client"

export const metadata: Metadata = {
  title: "Tracker",
  description: "Log and track your daily activities with the activity tracker.",
}

export default function TrackerPage() {
  return <TrackerClient />
}
