import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/seo/config"

export async function GET() {
  return NextResponse.json({
    resource: SITE_URL,
    authorization_servers: [
      "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1",
    ],
    scopes_supported: ["read", "write"],
    bearer_methods_supported: ["header"],
  })
}
