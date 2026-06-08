import type { Metadata } from "next";
import { CommerceSupportClient } from "./support-client";

export const metadata: Metadata = {
  title: "Commerce Support",
  description: "Reply to purchase-linked support conversations.",
};

export default function CommerceSupportPage() {
  return <CommerceSupportClient />;
}
