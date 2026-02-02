import type { Metadata } from "next"
import CalculatorHistoryClient from "./client"

export const metadata: Metadata = {
  title: "Calculator History | Jayant",
  description: "View your calculation history.",
}

export default function Page() {
  return <CalculatorHistoryClient />
}
