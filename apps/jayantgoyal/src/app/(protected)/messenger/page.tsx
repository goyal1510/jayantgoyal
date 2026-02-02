import type { Metadata } from "next"
import { MessagesPage } from "@/components/messenger/messages-page"

export const metadata: Metadata = {
  title: "Messenger | Jayant",
  description: "Send and receive messages securely.",
}

export default function MessengerPage() {
  return <MessagesPage />
}
