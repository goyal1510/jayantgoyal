"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  portfolio: "Portfolio",
  hero: "Hero",
  about: "About",
  education: "Education",
  experience: "Experience",
  skills: "Skills",
  "tech-icons": "Tech Icons",
  projects: "Projects",
  certificates: "Certificates",
  contact: "Contact",
  navigation: "Navigation",
  users: "User Management",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Home className="h-4 w-4" />
        <span className="font-medium">Home</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        href="/portfolio/hero"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] || segment;

        return (
          <div key={path} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium">{label}</span>
            ) : (
              <Link
                href={path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
