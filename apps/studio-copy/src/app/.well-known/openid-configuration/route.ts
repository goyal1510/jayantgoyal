import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    issuer: "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1",
    authorization_endpoint:
      "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1/authorize",
    token_endpoint:
      "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1/token",
    jwks_uri:
      "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1/.well-known/jwks.json",
    grant_types_supported: ["authorization_code", "refresh_token"],
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    scopes_supported: ["openid", "email", "profile"],
  })
}
