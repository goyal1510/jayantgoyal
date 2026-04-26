import type { Metadata } from "next"
import CustomCalculatorClient from "./client"

export const metadata: Metadata = {
  title: "Custom Calculator",
  description: "Build your own drag-and-drop calculator with custom formulas and fields.",
}

export default function Page() {
  return <CustomCalculatorClient />
}
