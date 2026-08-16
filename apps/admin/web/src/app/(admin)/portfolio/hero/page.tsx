import { redirect } from "next/navigation";

import { PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS } from "@/lib/config/portfolio-route-map";

/** Compatibility route for existing Hero bookmarks. */
export default function LegacyHeroPage() {
  redirect(PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS["/portfolio/hero"]);
}
