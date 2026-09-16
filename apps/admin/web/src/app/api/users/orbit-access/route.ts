import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@jayantgoyal/web-auth/service-role";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";

const ORBIT_ROLES = ["orbit.participant", "orbit.creator"] as const;
type OrbitRoleKey = (typeof ORBIT_ROLES)[number];

function isOrbitRole(value: unknown): value is OrbitRoleKey {
  return ORBIT_ROLES.includes(value as OrbitRoleKey);
}

async function parseBody(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    user_id?: unknown;
    role?: unknown;
  } | null;

  if (typeof body?.user_id !== "string") return null;
  if (body.role !== undefined && !isOrbitRole(body.role)) return null;

  return {
    userId: body.user_id,
    role: (body.role ?? "orbit.participant") as OrbitRoleKey,
  };
}

export async function GET() {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.usersRead);
  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const adminClient = createSupabaseServiceRoleClient();
  const [profilesResult, assignmentsResult, membershipsResult, authUsersResult] =
    await Promise.all([
      adminClient
        .schema("iam")
        .from("profiles")
        .select("user_id, first_name, last_name")
        .order("created_at", { ascending: false }),
      adminClient
        .schema("iam")
        .from("product_role_assignments")
        .select("user_id, role_key")
        .eq("product_key", "orbit"),
      adminClient
        .schema("iam")
        .from("product_memberships")
        .select("user_id, status")
        .eq("product_key", "orbit"),
      adminClient.auth.admin.listUsers(),
    ]);

  const queryError =
    profilesResult.error ??
    assignmentsResult.error ??
    membershipsResult.error ??
    authUsersResult.error;
  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const emailByUser = new Map(
    authUsersResult.data.users
      .filter((user) => Boolean(user.email))
      .map((user) => [user.id, user.email!]),
  );
  const roleByUser = new Map(
    (assignmentsResult.data ?? []).map((assignment) => [
      assignment.user_id,
      assignment.role_key as OrbitRoleKey,
    ]),
  );
  const activeUsers = new Set(
    (membershipsResult.data ?? [])
      .filter((membership) => membership.status === "active")
      .map((membership) => membership.user_id),
  );

  const profiles = (profilesResult.data ?? []).map((profile) => ({
    user_id: profile.user_id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: emailByUser.get(profile.user_id) ?? "Unknown",
    orbit_role: activeUsers.has(profile.user_id)
      ? (roleByUser.get(profile.user_id) ?? null)
      : null,
  }));

  const availableUsers = authUsersResult.data.users
    .filter(
      (user) =>
        Boolean(user.email) &&
        (!activeUsers.has(user.id) || !roleByUser.has(user.id)),
    )
    .map((user) => ({
      id: user.id,
      email: user.email!,
    }));

  return NextResponse.json({ profiles, availableUsers });
}

export async function POST(request: Request) {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.usersCreate);
  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "A user and valid Orbit role are required." },
      { status: 400 },
    );
  }
  if (body.userId === access.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own Orbit access." },
      { status: 409 },
    );
  }

  const adminClient = createSupabaseServiceRoleClient();
  const { error } = await adminClient.schema("iam").rpc("set_orbit_access", {
    p_actor_user_id: access.user.id,
    p_target_user_id: body.userId,
    p_role_key: body.role,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Orbit access assigned." });
}

export async function PATCH(request: Request) {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.usersUpdate);
  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "A user and valid Orbit role are required." },
      { status: 400 },
    );
  }
  if (body.userId === access.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own Orbit access." },
      { status: 409 },
    );
  }

  const adminClient = createSupabaseServiceRoleClient();
  const { error } = await adminClient.schema("iam").rpc("set_orbit_access", {
    p_actor_user_id: access.user.id,
    p_target_user_id: body.userId,
    p_role_key: body.role,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Orbit access updated." });
}

export async function DELETE(request: Request) {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.usersDelete);
  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    user_id?: unknown;
  } | null;
  if (typeof body?.user_id !== "string") {
    return NextResponse.json({ error: "A user is required." }, { status: 400 });
  }
  if (body.user_id === access.user.id) {
    return NextResponse.json(
      { error: "You cannot remove your own Orbit access." },
      { status: 409 },
    );
  }

  const adminClient = createSupabaseServiceRoleClient();
  const { error } = await adminClient.schema("iam").rpc("revoke_orbit_access", {
    p_actor_user_id: access.user.id,
    p_target_user_id: body.user_id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Orbit access removed." });
}
