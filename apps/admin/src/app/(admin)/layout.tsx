import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/components/sidebar/dynamic-breadcrumb";
import ThemeToggle from "@/components/theme/theme-toggle";
import { ApplicationHeader } from "@repo/ui/application-shell";
import { LazyMotionProvider } from "@repo/ui/lazy-motion-provider";
import { SidebarInset, SidebarProvider } from "@repo/ui/sidebar";
import type { UserRole } from "@/lib/types";
import { RouteChangeProvider } from "@/components/providers/route-change-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const defaultWidth =
    Number(cookieStore.get("sidebar_width")?.value) || undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/welcome");
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/unauthorized");
  }

  const fullName =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    user.email?.split("@")[0] ||
    "User";

  const authUser = {
    id: user.id,
    email: user.email ?? "",
    name: fullName,
    role: profile.role as UserRole,
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen} defaultWidth={defaultWidth}>
      <AppSidebar user={authUser} />
      <SidebarInset>
        <ApplicationHeader
          breadcrumb={<DynamicBreadcrumb />}
          actions={<ThemeToggle />}
        />
        <LazyMotionProvider>
          <div className="flex flex-1 flex-col gap-4 p-4 min-w-0">
            <RouteChangeProvider>{children}</RouteChangeProvider>
          </div>
        </LazyMotionProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
