"use client";

import { usePathname } from "next/navigation";
import { getToolByPath, toolCategories } from "@/lib/tools/tools";
import { getAppById } from "@/lib/config/hub-config";
import { getStudioProduct } from "@/lib/config/studio-inventory";
import { getStudioSurface } from "@/lib/config/studio-surfaces";
import { SITE_URL } from "@/lib/seo/config";

function getBreadcrumbItems(pathname: string): { name: string; url: string }[] {
  const items: { name: string; url: string }[] = [
    { name: "Home", url: SITE_URL },
  ];

  if (pathname === "/" || pathname === "") return items;

  if (pathname.startsWith("/products")) {
    const surface = getStudioSurface("studio-products");
    items.push({ name: surface.name, url: `${SITE_URL}${surface.href}` });
    const slug = pathname.split("/").filter(Boolean)[1];
    if (slug) {
      items.push({
        name: getStudioProduct(slug)?.name ?? "Product",
        url: `${SITE_URL}${pathname}`,
      });
    }
    return items;
  }

  // Tools routes
  if (pathname.startsWith("/tools")) {
    const surface = getStudioSurface("tech-tools");
    items.push({ name: surface.name, url: `${SITE_URL}${surface.href}` });
    const tool = getToolByPath(pathname);
    if (tool) {
      const category = toolCategories.find((cat) =>
        cat.tools.some((t) => t.id === tool.id),
      );
      if (category) {
        items.push({ name: category.title, url: `${SITE_URL}/tools` });
      }
      items.push({ name: tool.title, url: `${SITE_URL}${pathname}` });
    }
    return items;
  }

  // Games routes
  if (pathname.startsWith("/games")) {
    const surface = getStudioSurface("game-hub");
    items.push({ name: surface.name, url: `${SITE_URL}${surface.href}` });
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1 && segments[1]) {
      const gameApp = getAppById("game-hub");
      const navItem = gameApp?.navItems.find((item) => item.url === pathname);
      const gameName =
        navItem?.label ??
        segments[1]
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      items.push({ name: gameName, url: `${SITE_URL}${pathname}` });
    }
    return items;
  }

  // Activity Tracker routes
  if (pathname.startsWith("/activity-tracker")) {
    items.push({
      name: "Activity Tracker",
      url: `${SITE_URL}/activity-tracker/dashboard`,
    });
    if (pathname.includes("/dashboard"))
      items.push({ name: "Dashboard", url: `${SITE_URL}${pathname}` });
    else if (pathname.includes("/tracker"))
      items.push({ name: "Tracker", url: `${SITE_URL}${pathname}` });
    else if (pathname.includes("/management"))
      items.push({ name: "Management", url: `${SITE_URL}${pathname}` });
    return items;
  }

  // Calculator routes
  if (pathname.startsWith("/calculator")) {
    items.push({
      name: "Currency Calculator",
      url: `${SITE_URL}/calculator/new`,
    });
    if (pathname === "/calculator/new")
      items.push({ name: "New", url: `${SITE_URL}${pathname}` });
    else if (pathname === "/calculator/history")
      items.push({ name: "History", url: `${SITE_URL}${pathname}` });
    return items;
  }

  // Simple single-level pages
  const simplePages: Record<string, string> = {
    "/messenger": getStudioSurface("messenger").name,
    "/files": getStudioSurface("file-manager").name,
    "/weather": getStudioSurface("weather").name,
    "/github-stats": getStudioSurface("github-stats").name,
    "/custom-calculator": getStudioSurface("custom-calculator").name,
    "/terms-conditions": "Terms & Conditions",
  };

  for (const [path, name] of Object.entries(simplePages)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      items.push({ name, url: `${SITE_URL}${path}` });
      return items;
    }
  }

  return items;
}

export function DynamicBreadcrumbJsonLd() {
  const pathname = usePathname();
  const items = getBreadcrumbItems(pathname);

  if (items.length <= 1) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
