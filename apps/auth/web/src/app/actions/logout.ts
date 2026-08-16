"use server";

import { redirect } from "next/navigation";

import {
  signOutSession,
  type SignOutScope,
} from "@jayantgoyal/web-auth/logout";

import { actionContext, stringField } from "@/lib/auth/action-support";
import { buildSignedOutLoginUrl } from "@/lib/auth/returns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logoutAction(formData: FormData): Promise<void> {
  const context = await actionContext();
  if ("error" in context) redirect("/error?code=invalid_origin");
  const requestedScope = stringField(formData, "scope");
  const scope: SignOutScope = requestedScope === "global" ? "global" : "local";
  const supabase = await createSupabaseServerClient();
  await signOutSession(supabase, scope);
  redirect(
    buildSignedOutLoginUrl({
      value: stringField(formData, "return_to"),
      requestOrigin: context.requestOrigin,
    }),
  );
}
