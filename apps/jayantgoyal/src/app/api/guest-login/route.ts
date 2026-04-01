import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const DEVICE_LIMIT = 3; // Max guest logins per browser/device
const IP_LIMIT = 10; // Max guest logins per network (IPv6 /64)

// Normalize IPv6 to /64 prefix (network identifier) so rotating suffixes
// don't bypass the rate limit. IPv4 addresses pass through unchanged.
function normalizeIp(ip: string): string {
  if (!ip.includes(":")) return ip;
  const full = ip
    .replace(/::/, ":" + "0:".repeat(8 - ip.split(":").filter(Boolean).length))
    .split(":");
  return full.slice(0, 4).join(":") + "::/64";
}

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

  // Extract client IP: cf-connecting-ip (real IP via Cloudflare) → x-forwarded-for (local dev)
  const rawIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (!rawIp) {
    return NextResponse.json(
      { error: "Unable to determine client IP." },
      { status: 400 }
    );
  }

  const ipPrefix = normalizeIp(rawIp);

  // Read or generate device ID from cookie
  const existingDeviceId = request.cookies.get("guest_device_id")?.value;
  const deviceId = existingDeviceId || crypto.randomUUID();

  // Service role client to access the rate limit table (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check limits: device first (primary), then IP (fallback)
  const [deviceCount, ipCount] = await Promise.all([
    adminClient
      .schema("jg_account")
      .from("guest_login_limits")
      .select("id", { count: "exact", head: true })
      .eq("device_id", deviceId),
    adminClient
      .schema("jg_account")
      .from("guest_login_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip_prefix", ipPrefix),
  ]);

  if (deviceCount.error || ipCount.error) {
    console.error("Guest login limit check failed:", deviceCount.error || ipCount.error);
    return NextResponse.json(
      { error: "Failed to check guest login limit." },
      { status: 500 }
    );
  }

  if ((deviceCount.count ?? 0) >= DEVICE_LIMIT) {
    return NextResponse.json(
      { error: `Guest login limit reached (${DEVICE_LIMIT}). Please sign up for an account.` },
      { status: 429 }
    );
  }

  if ((ipCount.count ?? 0) >= IP_LIMIT) {
    return NextResponse.json(
      { error: `Too many guest accounts from this network. Please sign up for an account.` },
      { status: 429 }
    );
  }

  const used = (deviceCount.count ?? 0) + 1; // +1 for this login
  const remaining = DEVICE_LIMIT - used;

  // Proceed with anonymous sign-in
  const response = NextResponse.json({ success: true, remaining });

  // Set device ID cookie (10 years expiry)
  if (!existingDeviceId) {
    response.cookies.set("guest_device_id", deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

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

  // Record login after successful auth
  await adminClient
    .schema("jg_account")
    .from("guest_login_limits")
    .insert({ device_id: deviceId, ip_prefix: ipPrefix });

  return response;
}
