import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AdminCommandPalette } from "@/components/header/command-palette";
import { DynamicBreadcrumb } from "@/components/sidebar/dynamic-breadcrumb";
import { ApplicationShell } from "@jayant/web-ui/application-shell";
import { ApplicationTopbar } from "@jayant/web-ui/application-topbar";
import { LazyMotionProvider } from "@jayant/web-ui/lazy-motion-provider";
import {
  SIDEBAR_STATE_COOKIE_NAME,
  SIDEBAR_WIDTH_COOKIE_NAME,
  parseSidebarPreferences,
} from "@jayant/web-ui/lib/sidebar-preferences";
import { RouteChangeProvider } from "@jayant/web-ui/route-change-provider";
import {
  profileDisplayName,
  resolveProfileAvatar,
} from "@jayant/web-auth/profile";
import type { UserRole } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();
  const sidebarPreferences = parseSidebarPreferences({
    state: cookieStore.get(SIDEBAR_STATE_COOKIE_NAME)?.value,
    width: cookieStore.get(SIDEBAR_WIDTH_COOKIE_NAME)?.value,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/welcome");
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select(
      "role, first_name, last_name, avatar_url, avatar_mode, avatar_storage_path",
    )
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/unauthorized");
  }

  const fullName = profileDisplayName(profile, "User");
  const avatarUrl = await resolveProfileAvatar(supabase, user, profile);

  const authUser = {
    id: user.id,
    email: user.email ?? "",
    name: fullName,
    avatarUrl,
    role: profile.role as UserRole,
  };

  return (
    <ApplicationShell
      sidebar={<AppSidebar user={authUser} />}
      header={
        <ApplicationTopbar
          breadcrumb={<DynamicBreadcrumb />}
          actions={
            <>
              <AdminCommandPalette role={authUser.role} />
            </>
          }
        />
      }
      contentClassName="gap-4 p-4 sm:p-6"
      {...sidebarPreferences}
    >
      <LazyMotionProvider>
        <RouteChangeProvider>{children}</RouteChangeProvider>
      </LazyMotionProvider>
    </ApplicationShell>
  );
}
