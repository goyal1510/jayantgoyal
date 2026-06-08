import type { Metadata } from "next"

import { PolicyPage } from "@/components/commerce/policy-page"

export const metadata: Metadata = {
  title: "Privacy Policy | Jayant Tools",
  description:
    "How Jayant Tools collects, uses, and protects account, commerce, support, and product usage data.",
  openGraph: {
    title: "Privacy Policy | Jayant Tools",
    description:
      "Privacy policy for Jayant Tools accounts, commerce purchases, support, and product usage.",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This policy explains what data is used to run Jayant Tools, paid purchases, support, and account features."
      updatedAt="June 9, 2026"
      sections={[
        {
          title: "Account and workspace data",
          body: "We use your account identity to provide authenticated tools, private files, messenger access, purchase history, and entitlement checks. Private content stays scoped to your account unless you explicitly share it.",
        },
        {
          title: "Commerce data",
          body: "Payments are processed by Razorpay. Jayant Tools stores order ids, product ids, amounts, currency, status, and provider references needed for purchase records, access grants, refunds, and support.",
        },
        {
          title: "Support and communication",
          body: "Purchase-linked support messages are stored in Messenger so you and the support team can follow the request. Support emails may be sent only for purchase or support events and do not include raw payment payloads.",
        },
        {
          title: "Analytics",
          body: "Commerce analytics use aggregate events such as product views, checkout starts, successful verification, webhook health, and entitlement grants. Raw files, tool inputs, messages, signatures, and payment payloads are not used for analytics.",
        },
        {
          title: "Contact",
          body: "For privacy questions, use the contact form on jayantgoyal.com or the purchase support action in your account after buying a product.",
        },
      ]}
    />
  )
}
