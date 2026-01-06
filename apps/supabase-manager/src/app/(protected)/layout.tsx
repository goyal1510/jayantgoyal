import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import ThemeToogle from "@/components/theme-toogle";
import { ProjectSelector } from "@/components/project-selector";
import { ProjectProvider } from "@/contexts/project-context";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProjectProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 transition-[width,height] ease-linear backdrop-blur supports-[backdrop-filter]:bg-background/80 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Jayant Goyal</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Supabase Manager</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <ProjectSelector />
              <ThemeToogle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProjectProvider>
  );
}

