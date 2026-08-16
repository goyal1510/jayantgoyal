import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MfaVerifyStep } from "@/components/auth/mfa-verify-step";
import { Card, CardContent } from "@jayant/web-ui/card";

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export const metadata: Metadata = { title: "Verify MFA" };

export default async function MfaVerifyPage({ searchParams }: PageProps) {
  const { redirect: redirectUrl = "/" } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/welcome");
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = factors?.totp.some((f) => f.status === "verified");

  if (!hasVerifiedFactor) {
    redirect(redirectUrl);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <MfaVerifyStep redirectUrl={redirectUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
