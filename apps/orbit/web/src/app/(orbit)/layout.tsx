import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { checkProductAccess } from "@jayantgoyal/web-auth/authorization";
import { profileDisplayName } from "@jayantgoyal/web-auth/profile";
import { ApplicationShell } from "@jayantgoyal/web-ui/application-shell";
import { ApplicationTopbar } from "@jayantgoyal/web-ui/application-topbar";
import { LazyMotionProvider } from "@jayantgoyal/web-ui/lazy-motion-provider";
import {
  SIDEBAR_STATE_COOKIE_NAME,
  SIDEBAR_WIDTH_COOKIE_NAME,
  parseSidebarPreferences,
} from "@jayantgoyal/web-ui/lib/sidebar-preferences";
import { RouteChangeProvider } from "@jayantgoyal/web-ui/route-change-provider";

import { OrbitAppSidebar } from "@/features/orbit/app-sidebar";
import { OrbitCommandPalette } from "@/features/orbit/command-palette";
import { OrbitDynamicBreadcrumb } from "@/features/orbit/dynamic-breadcrumb";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadOrbitNavSnapshot } from "@/server/queries/nav-snapshot";

export default async function OrbitAppLayout({
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

  if (!user) redirect("/");

  const productAccess = (await checkProductAccess(supabase, "orbit")).allowed;
  if (!productAccess) redirect("/no-access");

  const [{ data: profile }, navSnapshot] = await Promise.all([
    supabase
      .schema("iam")
      .from("profiles")
      .select(
        "first_name, last_name, avatar_url, avatar_mode, avatar_storage_path",
      )
      .eq("user_id", user.id)
      .single(),
    loadOrbitNavSnapshot(supabase),
  ]);

  const menuUser = {
    name: profile ? profileDisplayName(profile, "User") : "User",
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url as string | null | undefined,
  };

  return (
    <ApplicationShell
      sidebar={<OrbitAppSidebar snapshot={navSnapshot} user={menuUser} />}
      header={
        <ApplicationTopbar
          className="border-border/70 bg-background/90 px-4"
          breadcrumb={
            <div className="w-full [&_[data-slot=breadcrumb-link]]:inline-flex [&_[data-slot=breadcrumb-link]]:h-8 [&_[data-slot=breadcrumb-link]]:items-center [&_[data-slot=breadcrumb-link]]:justify-center [&_[data-slot=breadcrumb-link]]:rounded-md [&_[data-slot=breadcrumb-link]]:px-2 [&_[data-slot=breadcrumb-link]]:hover:bg-accent [&_[data-slot=breadcrumb-link]]:hover:text-accent-foreground">
              <OrbitDynamicBreadcrumb snapshot={navSnapshot} />
            </div>
          }
          actions={<OrbitCommandPalette snapshot={navSnapshot} />}
        />
      }
      contentClassName="gap-4 p-4 sm:p-6 lg:p-8"
      {...sidebarPreferences}
    >
      <LazyMotionProvider>
        <RouteChangeProvider>{children}</RouteChangeProvider>
      </LazyMotionProvider>
    </ApplicationShell>
  );
}
