"use client";

import { usePathname } from "next/navigation";
import { getToolByPath, toolCategories } from "@/lib/tools/tools";
import { getAppById } from "@/lib/config/hub-config";

const BASE_URL = "https://www.jayantgoyal.com";

function getBreadcrumbItems(pathname: string): { name: string; url: string }[] {
  const items: { name: string; url: string }[] = [
    { name: "Home", url: BASE_URL },
  ];

  if (pathname === "/" || pathname === "") return items;

  // Tools routes
  if (pathname.startsWith("/tools")) {
    items.push({ name: "Tools", url: `${BASE_URL}/tools` });
    const tool = getToolByPath(pathname);
    if (tool) {
      const category = toolCategories.find((cat) =>
        cat.tools.some((t) => t.id === tool.id)
      );
      if (category) {
        items.push({ name: category.title, url: `${BASE_URL}/tools` });
      }
      items.push({ name: tool.title, url: `${BASE_URL}${pathname}` });
    }
    return items;
  }

  // Games routes
  if (pathname.startsWith("/games")) {
    items.push({ name: "Games", url: `${BASE_URL}/games` });
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1 && segments[1]) {
      const gameApp = getAppById("game-hub");
      const navItem = gameApp?.navItems.find((item) => item.url === pathname);
      const gameName = navItem?.label
        ?? segments[1].split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      items.push({ name: gameName, url: `${BASE_URL}${pathname}` });
    }
    return items;
  }

  // Activity Tracker routes
  if (pathname.startsWith("/activity-tracker")) {
    items.push({ name: "Activity Tracker", url: `${BASE_URL}/activity-tracker/dashboard` });
    if (pathname.includes("/dashboard")) items.push({ name: "Dashboard", url: `${BASE_URL}${pathname}` });
    else if (pathname.includes("/tracker")) items.push({ name: "Tracker", url: `${BASE_URL}${pathname}` });
    else if (pathname.includes("/management")) items.push({ name: "Management", url: `${BASE_URL}${pathname}` });
    return items;
  }

  // Calculator routes
  if (pathname.startsWith("/calculator")) {
    items.push({ name: "Currency Calculator", url: `${BASE_URL}/calculator/new` });
    if (pathname === "/calculator/new") items.push({ name: "New", url: `${BASE_URL}${pathname}` });
    else if (pathname === "/calculator/history") items.push({ name: "History", url: `${BASE_URL}${pathname}` });
    return items;
  }

  // Blog routes
  if (pathname === "/blogs" || pathname.startsWith("/blogs/")) {
    items.push({ name: "Blog", url: `${BASE_URL}/blogs` });
    return items;
  }
  if (pathname.startsWith("/blog/")) {
    items.push({ name: "Blog", url: `${BASE_URL}/blogs` });
    const slug = pathname.split("/").pop() ?? "";
    const name = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    items.push({ name, url: `${BASE_URL}${pathname}` });
    return items;
  }

  // Simple single-level pages
  const simplePages: Record<string, string> = {
    "/messenger": "Messenger",
    "/files": "File Manager",
    "/weather": "Weather",
    "/github-stats": "GitHub Stats",
    "/custom-calculator": "Custom Calculator",
    "/terms-conditions": "Terms & Conditions",
  };

  for (const [path, name] of Object.entries(simplePages)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      items.push({ name, url: `${BASE_URL}${path}` });
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
