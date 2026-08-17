import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeploymentsDashboard } from "./deployments-dashboard";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";

export const metadata: Metadata = { title: "Deployments" };

export default async function DeploymentsPage() {
  const access = await authorizeAdminCapability(
    ADMIN_CAPABILITIES.deploymentsRead,
  );
  if (!access.authorized && access.status === 401) {
    redirect("/welcome");
  }
  if (!access.authorized) {
    redirect("/");
  }

  const mutationAccess = await authorizeAdminCapability(
    ADMIN_CAPABILITIES.deploymentsUpdate,
  );
  return <DeploymentsDashboard canManage={mutationAccess.authorized} />;
}
