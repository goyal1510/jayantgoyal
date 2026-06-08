import type { Metadata } from "next"
import { MessagesPage } from "@/components/messenger/messages-page"

export const metadata: Metadata = {
  title: "Messenger",
  description: "Real-time messaging with Supabase Realtime — send and receive messages instantly.",
}

export default async function MessengerPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>
}) {
  const params = await searchParams
  return <MessagesPage initialConversationId={params.conversation} />
}
