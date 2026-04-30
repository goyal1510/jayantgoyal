import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/components/sidebar/dynamic-breadcrumb";
import { Separator } from "@repo/ui/separator";
import ThemeToogle from "@/components/theme/theme-toogle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/sidebar";
import { getPortfolioDataFromHeaders } from "@/lib/portfolio/server";
import { PortfolioDataProvider } from "@/lib/portfolio/use-portfolio-data";
import { TermsAcceptanceCheck } from "@/components/auth/terms-acceptance-check";
import { AuthGateWrapper } from "@/components/auth/auth-gate";
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider";
import { RouteChangeProvider } from "@/components/providers/route-change-provider";
import { LazyThreeBgWrapper, LazyCommandPalette } from "@/components/providers/lazy-components";
import { ThreeBgToggle } from "@/components/three/three-bg-toggle";
import { AuthToast } from "@/components/auth/auth-toast";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { data, profile, host, source } = await getPortfolioDataFromHeaders();

  const cookieStore = await cookies();

  // Check auth via cookie — zero network cost (no getUser() call)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "";
  const tokenName = `sb-${projectRef}-auth-token`;
  const isAuthenticated = Boolean(
    cookieStore.get(tokenName)?.value ?? cookieStore.get(`${tokenName}.0`)?.value
  );
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const defaultWidth = Number(cookieStore.get("sidebar_width")?.value) || undefined;

  return (
    <PortfolioDataProvider data={data} profile={profile} host={host} source={source}>
      {isAuthenticated && <TermsAcceptanceCheck />}
      <AuthToast />
      <SidebarProvider defaultOpen={defaultOpen} defaultWidth={defaultWidth}>
        <LazyThreeBgWrapper />
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 transition-[width,height] ease-linear backdrop-blur supports-[backdrop-filter]:bg-background/80 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 max-w-full">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <DynamicBreadcrumb />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LazyCommandPalette />
              <ThreeBgToggle />
              <ThemeToogle />
            </div>
          </header>
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
    </PortfolioDataProvider>
  );
}
