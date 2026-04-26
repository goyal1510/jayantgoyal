import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    resource: "https://www.jayantgoyal.com",
    authorization_servers: [
      "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1",
    ],
    scopes_supported: ["read", "write"],
    bearer_methods_supported: ["header"],
  })
}
