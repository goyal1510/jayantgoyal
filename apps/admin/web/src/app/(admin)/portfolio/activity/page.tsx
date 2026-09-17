import { redirect } from "next/navigation";

import { PORTFOLIO_WORKSPACE_ROUTES } from "@jayantgoyal/portfolio-contracts";

export default function LegacyActivityWorkspacePage() {
  redirect(PORTFOLIO_WORKSPACE_ROUTES.github_activity);
}
