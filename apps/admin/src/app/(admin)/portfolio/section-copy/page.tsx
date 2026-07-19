import { redirect } from "next/navigation";

import { PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS } from "@/lib/config/portfolio-route-map";

/** Compatibility route for the retired standalone section-copy editor. */
export default function LegacySectionCopyPage() {
  redirect(PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS["/portfolio/section-copy"]);
}
