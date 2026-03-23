import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/components/sidebar/dynamic-breadcrumb";
import { Separator } from "@repo/ui/separator";
import ThemeToggle from "@/components/theme/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/sidebar";
import type { UserRole } from "@/lib/types";
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider";
import { RouteChangeProvider } from "@/components/providers/route-change-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/unauthorized");
  }

  const authUser = {
    id: user.id,
    email: user.email ?? "",
    role: profile.role as UserRole,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={authUser} />
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
            <ThemeToggle />
          </div>
        </header>
        <LazyMotionProvider>
          <div className="flex flex-1 flex-col gap-4 p-4 min-w-0">
            <RouteChangeProvider>{children}</RouteChangeProvider>
          </div>
        </LazyMotionProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
