import type { ReactNode } from "react";

export function EditorialReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`editorial-reveal ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
