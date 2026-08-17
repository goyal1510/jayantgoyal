import { cookies } from "next/headers";

import { AccountBreadcrumb } from "@/components/account/account-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  profileDisplayName,
  resolveProfileAvatar,
} from "@jayantgoyal/web-auth/profile";
import { ApplicationShell } from "@jayantgoyal/web-ui/application-shell";
import { ApplicationTopbar } from "@jayantgoyal/web-ui/application-topbar";
import { RouteChangeProvider } from "@jayantgoyal/web-ui/route-change-provider";
import {
  SIDEBAR_STATE_COOKIE_NAME,
  SIDEBAR_WIDTH_COOKIE_NAME,
  parseSidebarPreferences,
} from "@jayantgoyal/web-ui/lib/sidebar-preferences";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieStore, supabase] = await Promise.all([
    cookies(),
    createSupabaseServerClient(),
  ]);
  const sidebarPreferences = parseSidebarPreferences({
    state: cookieStore.get(SIDEBAR_STATE_COOKIE_NAME)?.value,
    width: cookieStore.get(SIDEBAR_WIDTH_COOKIE_NAME)?.value,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .schema("iam")
        .from("profiles")
        .select(
          "first_name, last_name, avatar_url, avatar_mode, avatar_storage_path",
        )
        .eq("user_id", user.id)
        .single()
    : { data: null };
  const fullName = profileDisplayName(profile ?? {});
  const avatarUrl = user
    ? await resolveProfileAvatar(supabase, user, profile ?? {})
    : null;

  return (
    <div className="application-surface min-h-svh bg-background">
      <ApplicationShell
        sidebar={
          <AccountSidebar
            user={{
              name: fullName,
              email: user?.email ?? "",
              avatarUrl,
            }}
          />
        }
        header={
          <ApplicationTopbar
            className="border-border/70 bg-background/90 px-4"
            breadcrumb={
              <div className="w-full [&_[data-slot=breadcrumb-link]]:inline-flex [&_[data-slot=breadcrumb-link]]:h-8 [&_[data-slot=breadcrumb-link]]:items-center [&_[data-slot=breadcrumb-link]]:justify-center [&_[data-slot=breadcrumb-link]]:rounded-md [&_[data-slot=breadcrumb-link]]:px-2 [&_[data-slot=breadcrumb-link]]:transition-colors [&_[data-slot=breadcrumb-link]]:hover:bg-accent [&_[data-slot=breadcrumb-link]]:hover:text-accent-foreground">
                <AccountBreadcrumb />
              </div>
            }
          />
        }
        contentClassName="gap-6 p-4 sm:p-6"
        {...sidebarPreferences}
      >
        <main className="mx-auto w-full max-w-4xl space-y-6">
          <RouteChangeProvider>{children}</RouteChangeProvider>
        </main>
      </ApplicationShell>
    </div>
  );
}
