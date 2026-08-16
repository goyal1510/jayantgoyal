import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";

import {
  hasAuthSessionCookie,
  resolveAuthSessionMode,
} from "@jayantgoyal/web-auth/cookies";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/components/sidebar/dynamic-breadcrumb";
import { LazyMotionProvider } from "@jayantgoyal/web-ui/lazy-motion-provider";
import { ApplicationShell } from "@jayantgoyal/web-ui/application-shell";
import { ApplicationTopbar } from "@jayantgoyal/web-ui/application-topbar";
import {
  SIDEBAR_STATE_COOKIE_NAME,
  SIDEBAR_WIDTH_COOKIE_NAME,
  parseSidebarPreferences,
} from "@jayantgoyal/web-ui/lib/sidebar-preferences";
import { RouteChangeProvider } from "@jayantgoyal/web-ui/route-change-provider";
import { TermsAcceptanceCheck } from "@/components/auth/terms-acceptance-check";
import { AuthGateWrapper } from "@/components/auth/auth-gate";
import { LazyCommandPalette } from "@/components/providers/lazy-components";
import { AuthToast } from "@/components/auth/auth-toast";
import { DynamicBreadcrumbJsonLd } from "@/components/seo/dynamic-breadcrumb-jsonld";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  // Check auth via cookie — zero network cost (no getUser() call)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isAuthenticated = supabaseUrl
    ? hasAuthSessionCookie({
        supabaseUrl,
        hostname: headerStore.get("host"),
        mode: resolveAuthSessionMode(),
        cookies: cookieStore.getAll(),
      })
    : false;
  const sidebarPreferences = parseSidebarPreferences({
    state: cookieStore.get(SIDEBAR_STATE_COOKIE_NAME)?.value,
    width: cookieStore.get(SIDEBAR_WIDTH_COOKIE_NAME)?.value,
  });

  return (
    <>
      {isAuthenticated && <TermsAcceptanceCheck />}
      <AuthToast />
      <DynamicBreadcrumbJsonLd />
      <ApplicationShell
        sidebar={<AppSidebar />}
        header={
          <ApplicationTopbar
            className="border-border/70 bg-background/90 px-4"
            breadcrumb={
              <div className="w-full [&_[data-slot=breadcrumb-link]]:inline-flex [&_[data-slot=breadcrumb-link]]:h-8 [&_[data-slot=breadcrumb-link]]:items-center [&_[data-slot=breadcrumb-link]]:justify-center [&_[data-slot=breadcrumb-link]]:rounded-md [&_[data-slot=breadcrumb-link]]:px-2 [&_[data-slot=breadcrumb-link]]:hover:bg-accent [&_[data-slot=breadcrumb-link]]:hover:text-accent-foreground">
                <DynamicBreadcrumb />
              </div>
            }
            actions={
              <>
                <LazyCommandPalette />
              </>
            }
          />
        }
        contentClassName="gap-4 p-4 sm:p-6 lg:p-8 xl:p-10"
        {...sidebarPreferences}
      >
        <LazyMotionProvider>
          <RouteChangeProvider>
            <AuthGateWrapper isAuthenticated={isAuthenticated}>
              {children}
            </AuthGateWrapper>
          </RouteChangeProvider>
        </LazyMotionProvider>
      </ApplicationShell>
    </>
  );
}
