import type { Metadata } from "next";

import { AccountWorkspaceHeader } from "@/components/account/account-workspace-header";
import { MfaManager } from "@/components/account/mfa-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

export const metadata: Metadata = { title: "Multi-factor authentication" };

export const dynamic = "force-dynamic";

export default async function AccountMfaPage() {
  const supabase = await createSupabaseServerClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factorId =
    factors?.totp.find((factor) => factor.status === "verified")?.id ?? null;

  return (
    <div className="space-y-6">
      <AccountWorkspaceHeader workspace="mfa" />
      <Card>
        <CardHeader>
          <CardTitle>Authenticator app</CardTitle>
          <CardDescription>
            Recovery and sensitive security changes require a verified code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaManager initialFactorId={factorId} />
        </CardContent>
      </Card>
    </div>
  );
}
