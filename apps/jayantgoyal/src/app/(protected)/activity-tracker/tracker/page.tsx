import type { Metadata } from "next"
import TrackerClient from "./client"

export const metadata: Metadata = {
  title: "Activity Tracker | Jayant",
  description: "Track your daily activities.",
}

export default function TrackerPage() {
  return <TrackerClient />
}
