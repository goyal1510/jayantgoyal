import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeploymentDetail } from "./deployment-detail";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";

export const metadata: Metadata = { title: "Deployment Detail" };

export default async function DeploymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await authorizeAdminCapability(
    ADMIN_CAPABILITIES.deploymentsRead,
  );
  if (!access.authorized && access.status === 401) {
    redirect("/welcome");
  }
  if (!access.authorized) {
    redirect("/");
  }

  const { id } = await params;
  const mutationAccess = await authorizeAdminCapability(
    ADMIN_CAPABILITIES.deploymentsUpdate,
  );

  return (
    <DeploymentDetail deploymentId={id} canManage={mutationAccess.authorized} />
  );
}
