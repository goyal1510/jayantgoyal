import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { buildAuthLoginUrl } from "@jayant/web-auth/entry";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Continue to the Jayant account sign-in experience.",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [params, headerStore] = await Promise.all([searchParams, headers()]);
  redirect(
    buildAuthLoginUrl({
      requestUrl: "http://localhost:3001/welcome",
      requestHeaders: headerStore,
      returnPath: params.redirect,
    }).toString(),
  );
}
