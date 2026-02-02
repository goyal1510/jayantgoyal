import type { Metadata } from "next"
import NewCalculatorClient from "./client"

export const metadata: Metadata = {
  title: "New Calculator | Jayant",
  description: "Create a new calculator.",
}

export default function Page() {
  return <NewCalculatorClient />
}
