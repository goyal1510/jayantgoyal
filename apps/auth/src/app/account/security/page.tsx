import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Link2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { AccountWorkspaceHeader } from "@/components/account/account-workspace-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = { title: "Account security" };

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: factors }, { data: profile }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    user
      ? supabase
          .schema("jg_account")
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  const hasVerifiedMfa = Boolean(
    factors?.totp.some((factor) => factor.status === "verified"),
  );
  const connectedOAuthProviders = new Set(
    (user?.identities ?? [])
      .map((identity) => identity.provider)
      .filter((provider) => provider === "google" || provider === "github"),
  );
  const providerStatus = connectedOAuthProviders.size
    ? `${connectedOAuthProviders.size} connected`
    : "None connected";
  const displayName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <AccountWorkspaceHeader workspace="security" />

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Security areas"
      >
        <SecurityAreaCard
          href="/account/profile"
          icon={UserRound}
          title="Profile"
          description="The name used across Studio and Admin."
          status={displayName || "Needs a name"}
          ready={Boolean(displayName)}
        />
        <SecurityAreaCard
          href="/account/password"
          icon={KeyRound}
          title="Password"
          description="Change your password after confirming the current one."
          status="Protected"
          ready
        />
        <SecurityAreaCard
          href="/account/mfa"
          icon={ShieldCheck}
          title="MFA"
          description="Use an authenticator code as a second key."
          status={hasVerifiedMfa ? "Enabled" : "Not enabled"}
          ready={hasVerifiedMfa}
        />
        <SecurityAreaCard
          href="/account/providers"
          icon={Link2}
          title="Providers"
          description="Connect or disconnect Google and GitHub sign-in methods."
          status={providerStatus}
          ready={connectedOAuthProviders.size > 0}
        />
      </section>

      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg">Recovery behavior</CardTitle>
          <CardDescription>
            Password recovery respects the same MFA posture shown above.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {hasVerifiedMfa ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : (
            <CircleAlert className="size-4 text-amber-600" />
          )}
          <span>
            {hasVerifiedMfa
              ? "Recovery links will ask for your authenticator before a password can be changed."
              : "Add an authenticator to require MFA during password recovery."}
          </span>
          <Badge variant={hasVerifiedMfa ? "secondary" : "outline"}>
            {hasVerifiedMfa ? "MFA protected" : "Action available"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityAreaCard({
  href,
  icon: Icon,
  title,
  description,
  status,
  ready,
}: {
  href: string;
  icon: typeof UserRound;
  title: string;
  description: string;
  status: string;
  ready: boolean;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-colors group-hover:border-foreground/30 group-hover:bg-muted/20">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <span className="grid size-10 place-items-center rounded-xl bg-muted">
            <Icon className="size-5" />
          </span>
          <Badge variant={ready ? "secondary" : "outline"}>
            {ready ? "Ready" : "Review"}
          </Badge>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-2 leading-6">
            {description}
          </CardDescription>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium">
            {status}
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
