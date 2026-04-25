import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Check if a user has verified MFA factors using the Admin API.
 */
async function userHasMfa(supabaseUrl: string, userId: string): Promise<boolean> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return false;

  try {
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}/factors`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );
    if (!res.ok) return false;
    const factors = (await res.json()) as { factor_type: string; status: string }[];
    return factors.some((f) => f.factor_type === "totp" && f.status === "verified");
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return NextResponse.redirect(new URL("/welcome?error=auth", request.url));
  }

  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/welcome?error=auth", request.url));
  }

  // Check MFA via Admin API (no cookie dependency)
  if (data?.user && await userHasMfa(supabaseUrl, data.user.id)) {
    const mfaUrl = new URL(
      next !== "/" ? `/mfa-verify?redirect=${encodeURIComponent(next)}` : "/mfa-verify",
      request.url
    );
    const mfaResponse = NextResponse.redirect(mfaUrl);
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      mfaResponse.cookies.set(name, value, options);
    });
    return mfaResponse;
  }

  return response;
}
