import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeploymentsDashboard } from "./deployments-dashboard";

export const metadata: Metadata = { title: "Deployments" };

export default async function DeploymentsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/welcome");
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/");
  }

  return <DeploymentsDashboard />;
}
