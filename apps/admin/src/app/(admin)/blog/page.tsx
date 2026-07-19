import { redirect } from "next/navigation";

import { PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS } from "@/lib/config/portfolio-route-map";

/** Compatibility route for existing Blog bookmarks. */
export default function LegacyBlogPage() {
  redirect(PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS["/blog"]);
}
