import type { Metadata } from "next"
import { ScratchpadPage } from "@/components/scratchpad/scratchpad-page"

export const metadata: Metadata = {
  title: "Sync Scratchpad",
  description: "Real-time messaging with Supabase Realtime — send and receive entries instantly.",
}

export default function ScratchpadRoute() {
  return <ScratchpadPage />
}
