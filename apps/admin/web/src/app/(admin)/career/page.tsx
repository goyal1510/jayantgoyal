import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";
import { loadCareerOverview } from "@/lib/career-server";
import { CareerDashboard } from "./career-dashboard";

export const metadata: Metadata = { title: "Career pipeline" };

export default async function CareerPage() {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.careerRead);
  if (!access.authorized && access.status === 401) redirect("/welcome");
  if (!access.authorized) redirect("/");

  const overview = await loadCareerOverview();
  return <CareerDashboard overview={overview} />;
}
