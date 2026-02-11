import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserManagement } from "./user-management";

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is super_admin
  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/");
  }

  return <UserManagement currentUserId={user.id} />;
}
