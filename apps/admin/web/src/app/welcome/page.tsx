import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { buildAuthLoginUrl } from "@jayant/web-auth/entry";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [params, headerStore] = await Promise.all([searchParams, headers()]);
  redirect(
    buildAuthLoginUrl({
      requestUrl: "http://localhost:3002/welcome",
      requestHeaders: headerStore,
      returnPath: params.redirect,
    }).toString(),
  );
}
