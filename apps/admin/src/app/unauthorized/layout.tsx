import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Access Denied" };

export default function UnauthorizedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
