import type { Metadata } from "next"

import { PolicyPage } from "@/components/commerce/policy-page"

export const metadata: Metadata = {
  title: "Refund Policy | Jayant Tools",
  description:
    "Refund handling for Jayant Tools digital products, workspace upgrades, and service packages.",
  openGraph: {
    title: "Refund Policy | Jayant Tools",
    description:
      "Refund handling for Jayant Tools digital products, workspace upgrades, and service packages.",
  },
}

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Refunds"
      title="Refund Policy"
      description="This policy sets expectations for refunds on digital access, workspace upgrades, and services sold through Jayant Tools."
      updatedAt="June 9, 2026"
      sections={[
        {
          title: "Digital products and workspace upgrades",
          body: "Refund requests are reviewed case by case. If access was not delivered, a duplicate charge occurred, or a technical issue prevents use, contact support with the order from your purchase history.",
        },
        {
          title: "Service packages",
          body: "Fixed-scope service work is refundable before work starts. After work begins, refunds depend on delivered milestones, unused scope, and written agreement for the package.",
        },
        {
          title: "How to request a refund",
          body: "Open your account purchase history, choose the paid order, and start a support conversation. Include the reason and the outcome you want so the request can be reviewed quickly.",
        },
        {
          title: "Payment provider timing",
          body: "Approved refunds are processed through the payment provider. Bank or card settlement timing depends on Razorpay and the issuing bank.",
        },
      ]}
    />
  )
}
