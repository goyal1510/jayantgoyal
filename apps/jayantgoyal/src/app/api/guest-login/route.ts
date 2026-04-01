import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const GUEST_LOGIN_LIMIT = 3;

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase configuration is missing." },
      { status: 500 }
    );
  }

  // Extract client IP (Vercel sets x-forwarded-for)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();

  if (!ip) {
    return NextResponse.json(
      { error: "Unable to determine client IP." },
      { status: 400 }
    );
  }

  // Service role client to access the rate limit table (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check current login count for this IP
  const { data: existing, error: selectError } = await adminClient
    .schema("jg_account")
    .from("guest_login_limits")
    .select("login_count")
    .eq("ip_address", ip)
    .maybeSingle();

  if (selectError) {
    console.error("Guest login limit check failed:", selectError);
    return NextResponse.json(
      { error: "Failed to check guest login limit." },
      { status: 500 }
    );
  }

  if (existing && existing.login_count >= GUEST_LOGIN_LIMIT) {
    return NextResponse.json(
      {
        error: `Guest login limit reached (${GUEST_LOGIN_LIMIT}). Please sign up for an account.`,
      },
      { status: 429 }
    );
  }

  // Proceed with anonymous sign-in
  const response = NextResponse.json({ success: true });

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

  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Increment login count after successful auth
  await adminClient
    .schema("jg_account")
    .from("guest_login_limits")
    .upsert(
      {
        ip_address: ip,
        login_count: existing ? existing.login_count + 1 : 1,
        last_login_at: new Date().toISOString(),
      },
      { onConflict: "ip_address" }
    );

  return response;
}
