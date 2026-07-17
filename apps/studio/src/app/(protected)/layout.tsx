import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/components/sidebar/dynamic-breadcrumb";
import ThemeToogle from "@/components/theme/theme-toogle";
import { ApplicationHeader } from "@repo/ui/application-shell";
import { LazyMotionProvider } from "@repo/ui/lazy-motion-provider";
import { SidebarInset, SidebarProvider } from "@repo/ui/sidebar";
import { TermsAcceptanceCheck } from "@/components/auth/terms-acceptance-check";
import { AuthGateWrapper } from "@/components/auth/auth-gate";
import { RouteChangeProvider } from "@/components/providers/route-change-provider";
import { LazyCommandPalette } from "@/components/providers/lazy-components";
import { AuthToast } from "@/components/auth/auth-toast";
import { DynamicBreadcrumbJsonLd } from "@/components/seo/dynamic-breadcrumb-jsonld";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();

  // Check auth via cookie — zero network cost (no getUser() call)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = supabaseUrl
    ? new URL(supabaseUrl).hostname.split(".")[0]
    : "";
  const tokenName = `sb-${projectRef}-auth-token`;
  const isAuthenticated = Boolean(
    cookieStore.get(tokenName)?.value ??
      cookieStore.get(`${tokenName}.0`)?.value,
  );
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const defaultWidth =
    Number(cookieStore.get("sidebar_width")?.value) || undefined;

  return (
    <>
      {isAuthenticated && <TermsAcceptanceCheck />}
      <AuthToast />
      <DynamicBreadcrumbJsonLd />
      <SidebarProvider defaultOpen={defaultOpen} defaultWidth={defaultWidth}>
        <AppSidebar />
        <SidebarInset>
          <ApplicationHeader
            breadcrumb={<DynamicBreadcrumb />}
            actions={
              <>
                <LazyCommandPalette />
                <ThemeToogle />
              </>
            }
          />
          <LazyMotionProvider>
            <div className="flex flex-1 flex-col gap-4 p-4 min-w-0">
              <RouteChangeProvider>
                <AuthGateWrapper isAuthenticated={isAuthenticated}>
                  {children}
                </AuthGateWrapper>
              </RouteChangeProvider>
            </div>
          </LazyMotionProvider>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
