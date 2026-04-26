import type { Metadata } from "next"
import { MessagesPage } from "@/components/messenger/messages-page"

export const metadata: Metadata = {
  title: "Messenger",
  description: "Real-time messaging with Supabase Realtime — send and receive messages instantly.",
}

export default function MessengerPage() {
  return <MessagesPage />
}
