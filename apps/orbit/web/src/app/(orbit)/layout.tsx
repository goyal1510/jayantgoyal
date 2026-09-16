import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { Orbit as OrbitIcon } from "lucide-react";

import { checkProductAccess } from "@jayantgoyal/web-auth/authorization";
import { profileDisplayName } from "@jayantgoyal/web-auth/profile";
import { applicationUrl } from "@jayantgoyal/web-urls";
import { ApplicationShell } from "@jayantgoyal/web-ui/application-shell";
import { ApplicationTopbar } from "@jayantgoyal/web-ui/application-topbar";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  SIDEBAR_STATE_COOKIE_NAME,
  SIDEBAR_WIDTH_COOKIE_NAME,
  parseSidebarPreferences,
} from "@jayantgoyal/web-ui/lib/sidebar-preferences";
import { RouteChangeProvider } from "@jayantgoyal/web-ui/route-change-provider";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { data: profile } = await supabase
    .schema("iam")
    .from("profiles")
    .select(
      "first_name, last_name, avatar_url, avatar_mode, avatar_storage_path",
    )
    .eq("user_id", user.id)
    .single();

  const fullName = profile ? profileDisplayName(profile, "User") : "User";

  return (
    <ApplicationShell
      sidebar={
        <aside className="flex h-full flex-col gap-4 border-r bg-sidebar p-4 text-sidebar-foreground">
          <div className="flex items-center gap-2 px-2 py-1">
            <OrbitIcon className="h-5 w-5 text-primary" aria-hidden />
            <span className="font-semibold">Orbit</span>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            <Link
              href="/home"
              className="rounded-md px-3 py-2 hover:bg-sidebar-accent"
            >
              Home
            </Link>
            <Link
              href="/inbox"
              className="rounded-md px-3 py-2 hover:bg-sidebar-accent"
            >
              Inbox
            </Link>
          </nav>
          <div className="mt-auto space-y-2 border-t pt-4 text-xs text-muted-foreground">
            <p className="truncate px-2">{fullName}</p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={applicationUrl("auth", "/account/security")}>Account</a>
            </Button>
          </div>
        </aside>
      }
      header={
        <ApplicationTopbar
          breadcrumb={
            <span className="text-sm font-medium text-muted-foreground">
              Keep work moving · {fullName}
            </span>
          }
        />
      }
      contentClassName="gap-4 p-4 sm:p-6"
      {...sidebarPreferences}
    >
      <RouteChangeProvider>{children}</RouteChangeProvider>
    </ApplicationShell>
  );
}
