import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Not needed for reading
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({
      needsAcceptance: false,
      isAuthenticated: false,
    });
  }

  // Anonymous users don't need to accept terms
  const isAnonymous = user.is_anonymous === true;
  if (isAnonymous) {
    return NextResponse.json({
      needsAcceptance: false,
      isAuthenticated: true,
      isGuest: true,
    });
  }

  // Check if terms are accepted
  const termsAccepted = user.user_metadata?.terms_accepted === true;

  return NextResponse.json({
    needsAcceptance: !termsAccepted,
    isAuthenticated: true,
    isGuest: false,
  });
}
