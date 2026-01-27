import type { ReactNode } from "react";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/components/sidebar/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import ThemeToogle from "@/components/theme/theme-toogle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getPortfolioDataFromHeaders } from "@/lib/portfolio/server";
import { PortfolioDataProvider } from "@/lib/portfolio/use-portfolio-data";
import { TermsAcceptanceCheck } from "@/components/auth/terms-acceptance-check";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile, host } = await getPortfolioDataFromHeaders();

  return (
    <PortfolioDataProvider profile={profile} host={host}>
      <TermsAcceptanceCheck />
      <SidebarProvider>
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
            <div className="shrink-0">
              <ThemeToogle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 min-w-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </PortfolioDataProvider>
  );
}
