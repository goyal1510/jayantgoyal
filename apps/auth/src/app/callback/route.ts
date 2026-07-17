import { NextRequest, NextResponse } from "next/server";

import {
  copyAuthCacheHeaders,
  createSupabaseRequestClient,
} from "@repo/auth/server";

import { resolveAuthReturnTarget } from "@/lib/auth/returns";
import { classifyAuthCallback } from "@/lib/auth/callback";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function copyAuthState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
  copyAuthCacheHeaders(source.headers, target.headers);
  return noStore(target);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const callback = classifyAuthCallback(url.searchParams);
  if (callback.kind === "provider-error") {
    return noStore(
      NextResponse.redirect(
        new URL("/error?code=provider_cancelled", request.url),
      ),
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return noStore(
      NextResponse.redirect(new URL("/error?code=configuration", request.url)),
    );
  }

  const returnCookie = request.cookies.get("auth_return_to")?.value;
  const returnTo = resolveAuthReturnTarget(
    returnCookie ?? url.searchParams.get("return_to"),
    url.origin,
  );
  const response = noStore(
    NextResponse.redirect(new URL(returnTo, request.url)),
  );
  const supabase = await createSupabaseRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
    responseHeaders: response.headers,
    hostname: url.hostname,
  });

  let recovery = false;

  if (callback.kind === "code") {
    const { error } = await supabase.auth.exchangeCodeForSession(callback.code);
    if (error) {
      return copyAuthState(
        response,
        NextResponse.redirect(
          new URL("/error?code=invalid_callback", request.url),
        ),
      );
    }
  } else if (callback.kind === "otp") {
    recovery = callback.recovery;
    const { error } = await supabase.auth.verifyOtp({
      token_hash: callback.tokenHash,
      type: callback.type,
    });
    if (error) {
      return copyAuthState(
        response,
        NextResponse.redirect(new URL("/error?code=expired_link", request.url)),
      );
    }
  } else {
    return noStore(
      NextResponse.redirect(
        new URL("/error?code=invalid_callback", request.url),
      ),
    );
  }

  if (recovery) {
    response.cookies.set("auth_return_to", "/reset-password", {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    response.cookies.set("auth_recovery", "verified", {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp.some((factor) => factor.status === "verified")) {
    return copyAuthState(
      response,
      NextResponse.redirect(new URL("/mfa", request.url)),
    );
  }

  if (recovery) {
    return copyAuthState(
      response,
      NextResponse.redirect(new URL("/reset-password", request.url)),
    );
  }

  response.cookies.set("auth_return_to", "", { path: "/", maxAge: 0 });
  return response;
}
