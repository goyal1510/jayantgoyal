"use server"

import { headers } from "next/headers"

import { createSupabaseServerClient } from "@/lib/supabase/server"

type ForgotPasswordFormState = {
  error?: string
  success?: boolean
}

export async function forgotPassword(
  prevState: ForgotPasswordFormState,
  formData: FormData
): Promise<ForgotPasswordFormState> {
  const email = formData.get("email")

  if (!email) {
    return { error: "Email is required." }
  }

  const origin =
    (await headers()).get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://jayantgoyal.com"

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(String(email), {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
