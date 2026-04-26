import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { TermsAcceptanceCheck } from "@/components/auth/terms-acceptance-check";
import { AuthToast } from "@/components/auth/auth-toast";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppLayout>
      <TermsAcceptanceCheck />
      <AuthToast />
      {children}
    </AppLayout>
  );
}
