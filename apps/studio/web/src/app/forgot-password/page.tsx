import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { buildAuthForgotPasswordUrl } from "@jayant/web-auth/entry";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  redirect(
    buildAuthForgotPasswordUrl({
      requestUrl: "http://localhost:3001/forgot-password",
      requestHeaders: await headers(),
    }).toString(),
  );
}
