import type { Metadata } from "next";

import { AccountWorkspaceHeader } from "@/components/account/account-workspace-header";
import { PasswordForm } from "@/components/account/password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

export const metadata: Metadata = { title: "Password" };

export default function AccountPasswordPage() {
  return (
    <div className="space-y-6">
      <AccountWorkspaceHeader workspace="password" />
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Confirm your current password before choosing a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
