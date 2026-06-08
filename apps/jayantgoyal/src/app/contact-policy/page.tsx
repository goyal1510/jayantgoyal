import type { Metadata } from "next"

import { PolicyPage } from "@/components/commerce/policy-page"

export const metadata: Metadata = {
  title: "Contact Policy | Jayant Tools",
  description:
    "How to contact Jayant Tools for account, purchase, support, refund, and privacy requests.",
  openGraph: {
    title: "Contact Policy | Jayant Tools",
    description:
      "Contact paths for Jayant Tools account, purchase, support, refund, and privacy requests.",
  },
}

export default function ContactPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Contact"
      title="Contact Policy"
      description="Use the right channel so purchase and account requests carry enough context to resolve."
      updatedAt="June 9, 2026"
      sections={[
        {
          title: "Purchase support",
          body: "For paid products, use Account > Purchases > Get support. This links your message to the order and keeps replies inside Messenger.",
        },
        {
          title: "General contact",
          body: "For non-purchase questions, use the portfolio contact form on jayantgoyal.com. Replies are handled through email.",
        },
        {
          title: "Security or privacy",
          body: "For account privacy, data access, or security concerns, include the affected account email and avoid sending secrets, payment credentials, or private keys in the message.",
        },
        {
          title: "Response expectations",
          body: "Purchase-linked support is prioritized over general inquiries because the order context is available to the support team.",
        },
      ]}
    />
  )
}
