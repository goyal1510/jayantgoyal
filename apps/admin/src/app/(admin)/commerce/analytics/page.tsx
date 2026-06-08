import type { Metadata } from "next";
import { CommerceAnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Commerce Analytics",
  description: "Revenue, funnel, product, webhook, and support metrics.",
};

export default function CommerceAnalyticsPage() {
  return <CommerceAnalyticsClient />;
}
