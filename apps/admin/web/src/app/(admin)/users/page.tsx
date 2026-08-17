import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserManagement } from "./user-management";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.usersRead);
  if (!access.authorized && access.status === 401) {
    redirect("/welcome");
  }
  if (!access.authorized) {
    redirect("/");
  }

  const mutationAccess = await authorizeAdminCapability(
    ADMIN_CAPABILITIES.usersUpdate,
  );
  return (
    <UserManagement
      currentUserId={access.user.id}
      canManageAccess={mutationAccess.authorized}
    />
  );
}
