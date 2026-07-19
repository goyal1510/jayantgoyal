import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { resolveAuthReturnTarget } from "@/lib/auth/returns";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to: returnTo } = await searchParams;
  redirect(
    `/welcome?return_to=${encodeURIComponent(resolveAuthReturnTarget(returnTo))}`,
  );
}
