"use server"

import { cookies, headers } from "next/headers"

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

  // Store the post-auth redirect destination in a cookie.
  // Query params in redirectTo cause Supabase to reject the URL and fall back to the Site URL.
  const cookieStore = await cookies()
  cookieStore.set("auth_redirect", "/reset-password", {
    path: "/",
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    maxAge: 3600,
  })

  const { error } = await supabase.auth.resetPasswordForEmail(String(email), {
    redirectTo: `${origin}/auth/callback`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
