import { redirect } from "next/navigation";

import { PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS } from "@/lib/config/portfolio-route-map";

/** Compatibility route for existing Education bookmarks. */
export default function LegacyEducationPage() {
  redirect(PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS["/portfolio/education"]);
}
