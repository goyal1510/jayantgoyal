import type { Metadata } from "next"
import CustomCalculatorClient from "./client"

export const metadata: Metadata = {
  title: "Custom Calculator | Jayant Goyal",
  description: "Build and use custom calculators.",
}

export default function Page() {
  return <CustomCalculatorClient />
}
