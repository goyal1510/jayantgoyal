import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/app-layout";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
