"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/home", label: "Home" },
  { href: "/inbox", label: "Inbox" },
];

export function OrbitNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-md bg-sidebar-accent px-3 py-2 font-medium text-sidebar-accent-foreground"
                : "rounded-md px-3 py-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
