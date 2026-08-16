import Link from "next/link";
import type { ReactNode } from "react";

const baseClassName =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-current/25 px-4 py-2 text-sm font-medium transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50";

export function EditorialButton({
  children,
  href,
  className = "",
  onClick,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}) {
  if (href) {
    return (
      <Link href={href} className={`${baseClassName} ${className}`.trim()}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${baseClassName} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
