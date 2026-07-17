import type { Metadata } from "next"
import CalculatorHistoryClient from "./client"

export const metadata: Metadata = {
  title: "Calculation History",
  description: "View and manage your saved cash denomination calculations.",
}

export default function Page() {
  return <CalculatorHistoryClient />
}
