import { redirect } from "next/navigation";

import { PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS } from "@/lib/config/portfolio-route-map";

/** Compatibility route for the retired standalone navigation editor. */
export default function LegacyNavigationPage() {
  redirect(PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS["/portfolio/navigation"]);
}
