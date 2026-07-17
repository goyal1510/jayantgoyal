"use client";

import type {
  ComponentProps,
  ElementType,
  MouseEventHandler,
  ReactNode,
} from "react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "./sidebar";

export interface AppSidebarBrand {
  name: string;
  href: string;
  icon: ElementType<{ className?: string }>;
}

export interface AppSidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon: ElementType<{ className?: string }>;
  iconClassName?: string;
  isActive?: boolean;
  visible?: boolean;
  external?: boolean;
  onSelect?: MouseEventHandler<HTMLAnchorElement>;
}

export interface AppSidebarNavGroupConfig {
  id: string;
  label: string;
  items: AppSidebarNavItem[];
  visible?: boolean;
}

function SidebarLink({
  item,
  onNavigate,
}: {
  item: AppSidebarNavItem;
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const content = (
    <>
      <item.icon className={item.iconClassName} />
      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} onClick={onNavigate}>
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate}>
      {content}
    </Link>
  );
}

function AppSidebarItems({ items }: { items: AppSidebarNavItem[] }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const visibleItems = items.filter((item) => item.visible !== false);

  return (
    <SidebarMenu>
      {visibleItems.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            asChild
            isActive={item.isActive}
            tooltip={item.label}
          >
            <SidebarLink
              item={item}
              onNavigate={(event) => {
                item.onSelect?.(event);
                if (isMobile) {
                  window.setTimeout(() => setOpenMobile(false), 0);
                }
              }}
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebarNavGroup({
  group,
}: {
  group: AppSidebarNavGroupConfig;
}) {
  const visibleItems = group.items.filter((item) => item.visible !== false);
  if (group.visible === false || visibleItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <AppSidebarItems items={visibleItems} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export interface AppSidebarShellProps
  extends Omit<ComponentProps<typeof Sidebar>, "children"> {
  brand: AppSidebarBrand;
  groups?: AppSidebarNavGroupConfig[];
  children?: ReactNode;
  footerItems?: AppSidebarNavItem[];
  footer?: ReactNode;
}

export function AppSidebarShell({
  brand,
  groups = [],
  children,
  footerItems = [],
  footer,
  collapsible = "icon",
  ...props
}: AppSidebarShellProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const visibleFooterItems = footerItems.filter(
    (item) => item.visible !== false,
  );
  const showFooter = visibleFooterItems.length > 0 || Boolean(footer);

  return (
    <Sidebar collapsible={collapsible} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={brand.name}>
              <Link
                href={brand.href}
                onClick={() => {
                  if (isMobile) {
                    window.setTimeout(() => setOpenMobile(false), 0);
                  }
                }}
              >
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <brand.icon className="size-4" />
                </span>
                <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
                  {brand.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <AppSidebarNavGroup key={group.id} group={group} />
        ))}
        {children}
      </SidebarContent>

      {showFooter && (
        <>
          <SidebarSeparator />
          <SidebarFooter>
            {visibleFooterItems.length > 0 && (
              <AppSidebarItems items={visibleFooterItems} />
            )}
            {footer}
          </SidebarFooter>
        </>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
