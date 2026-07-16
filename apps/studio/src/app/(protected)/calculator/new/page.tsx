import type { Metadata } from "next"
import NewCalculatorClient from "./client"

export const metadata: Metadata = {
  title: "New Calculation",
  description: "Cash denomination calculator — count currency notes and coins with instant totals.",
}

export default function Page() {
  return <NewCalculatorClient />
}
