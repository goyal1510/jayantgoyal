"use client";

import type {
  ComponentProps,
  ElementType,
  MouseEventHandler,
  ReactNode,
} from "react";
import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import { Separator } from "./separator";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { cn } from "../lib/utils";

export interface ApplicationBrand {
  name: string;
  href: string;
  icon: ElementType<{ className?: string }>;
}

export interface ApplicationNavigationItem {
  id: string;
  label: string;
  href?: string;
  icon: ElementType<{ className?: string }>;
  iconClassName?: string;
  isActive?: boolean;
  external?: boolean;
  onSelect?: MouseEventHandler<HTMLAnchorElement>;
  children?: ApplicationNavigationItem[];
  defaultOpen?: boolean;
}

export interface ApplicationNavigationSection {
  id: string;
  label: string;
  items: ApplicationNavigationItem[];
}

export interface BreadcrumbTrailItem {
  id: string;
  label: string;
  href?: string;
}

function closeMobileSidebar(
  isMobile: boolean,
  setOpenMobile: (open: boolean) => void,
) {
  if (isMobile) setOpenMobile(false);
}

export function ApplicationBrandHeader({ brand }: { brand: ApplicationBrand }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          asChild
        >
          <Link
            href={brand.href}
            onClick={() => closeMobileSidebar(isMobile, setOpenMobile)}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <brand.icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{brand.name}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export interface ApplicationSidebarFrameProps
  extends Omit<ComponentProps<typeof Sidebar>, "children"> {
  brand: ApplicationBrand;
  children: ReactNode;
  footer?: ReactNode;
}

export interface ApplicationShellProps
  extends Omit<ComponentProps<typeof SidebarProvider>, "children"> {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  insetClassName?: string;
  contentClassName?: string;
}

/** Shared product-app frame; navigation and permissions remain app-owned. */
export function ApplicationShell({
  sidebar,
  header,
  children,
  insetClassName,
  contentClassName,
  ...providerProps
}: ApplicationShellProps) {
  return (
    <SidebarProvider {...providerProps}>
      {sidebar}
      <SidebarInset className={insetClassName}>
        {header}
        <div className={cn("flex min-w-0 flex-1 flex-col", contentClassName)}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function ApplicationSidebarFrame({
  brand,
  children,
  footer,
  collapsible = "icon",
  ...props
}: ApplicationSidebarFrameProps) {
  return (
    <Sidebar collapsible={collapsible} {...props}>
      <SidebarHeader>
        <ApplicationBrandHeader brand={brand} />
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      {footer != null && (
        <>
          <Separator />
          <SidebarFooter>{footer}</SidebarFooter>
        </>
      )}
      <SidebarRail />
    </Sidebar>
  );
}

export function ApplicationSidebarSection({
  section,
}: {
  section: ApplicationNavigationSection;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <ApplicationSidebarMenu items={section.items} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function ApplicationSidebarMenu({
  items,
}: {
  items: ApplicationNavigationItem[];
}) {
  return <ApplicationNavigationTree items={items} />;
}

function closeNestedMobileSidebar(
  isMobile: boolean,
  setOpenMobile: (open: boolean) => void,
) {
  if (isMobile) setOpenMobile(false);
}

function ApplicationNavigationNode({
  item,
  nested = false,
}: {
  item: ApplicationNavigationItem;
  nested?: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const hasChildren = Boolean(item.children?.length);

  if (hasChildren) {
    const childIsActive = item.children?.some((child) => child.isActive) ?? false;
    return (
      <Collapsible
        asChild
        defaultOpen={item.defaultOpen || childIsActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={item.isActive}
              tooltip={item.label}
              className={nested ? "text-sm" : undefined}
            >
              <item.icon className={item.iconClassName} />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children?.map((child) => (
                <ApplicationNavigationNode key={child.id} item={child} nested />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  const content = (
    <>
      <item.icon className={item.iconClassName} />
      <span>{item.label}</span>
    </>
  );
  const handleSelect: MouseEventHandler<HTMLAnchorElement> = (event) => {
    item.onSelect?.(event);
    closeNestedMobileSidebar(isMobile, setOpenMobile);
  };

  if (nested) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={item.isActive}>
          {item.external ? (
            <a href={item.href} onClick={handleSelect}>
              {content}
            </a>
          ) : (
            <Link href={item.href ?? "#"} onClick={handleSelect}>
              {content}
            </Link>
          )}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.label}>
        {item.external ? (
          <a href={item.href} onClick={handleSelect}>
            {content}
          </a>
        ) : (
          <Link href={item.href ?? "#"} onClick={handleSelect}>
            {content}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Recursive navigation presentation for flat and nested app-owned trees. */
export function ApplicationNavigationTree({
  items,
}: {
  items: ApplicationNavigationItem[];
}) {
  return <SidebarMenu>{items.map((item) => <ApplicationNavigationNode key={item.id} item={item} />)}</SidebarMenu>;
}

export function ApplicationHeader({
  breadcrumb,
  actions,
  className,
  sidebarControl,
}: {
  breadcrumb: ReactNode;
  actions?: ReactNode;
  className?: string;
  sidebarControl?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 max-w-full shrink-0 items-center gap-2 border-b bg-background/95 px-4 transition-[width,height] ease-linear backdrop-blur supports-[backdrop-filter]:bg-background/80 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {sidebarControl ?? (
          <>
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
          </>
        )}
        <div className="min-w-0 flex-1 overflow-hidden">{breadcrumb}</div>
      </div>
      {actions != null && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export function BreadcrumbTrail({
  homeHref,
  items,
}: {
  homeHref: string;
  items: BreadcrumbTrailItem[];
}) {
  return (
    <Breadcrumb className="min-w-0 flex-1 max-w-full">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              href={homeHref}
              aria-label="Home"
              className="flex items-center justify-center"
            >
              <Home className="size-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={item.id}>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem
                className={isLast ? "min-w-0 flex-1" : "shrink-0 max-w-[200px]"}
              >
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="truncate block">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate block">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
