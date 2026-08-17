import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@jayantgoyal/web-auth/service-role";
import { ADMIN_CAPABILITIES, authorizeAdminCapability } from "@/lib/access";
import type { AdminRoleKey } from "@/lib/types";

interface ProfileRow {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  avatar_mode: "provider" | "upload" | "initials";
  avatar_provider: string | null;
  avatar_storage_path: string | null;
  avatar_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

const ADMIN_ROLES: readonly AdminRoleKey[] = [
  "admin.viewer",
  "admin.full_access",
];

function isAdminRole(value: unknown): value is AdminRoleKey {
  return ADMIN_ROLES.includes(value as AdminRoleKey);
}

async function parseAssignment(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    user_id?: unknown;
    role?: unknown;
  } | null;

  if (typeof body?.user_id !== "string" || !isAdminRole(body.role)) {
    return null;
  }

  return { userId: body.user_id, role: body.role };
}

async function saveAssignment({
  actorUserId,
  targetUserId,
  role,
}: {
  actorUserId: string;
  targetUserId: string;
  role: AdminRoleKey;
}) {
  if (actorUserId === targetUserId) {
    return { error: "You cannot change your own Admin access.", status: 409 };
  }

  const adminClient = createSupabaseServiceRoleClient();
  const { error } = await adminClient.schema("iam").rpc("set_admin_access", {
    p_actor_user_id: actorUserId,
    p_target_user_id: targetUserId,
    p_role_key: role,
  });
  if (error) return { error: error.message, status: 500 };

  return { error: null, status: 200 };
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
  const [
    profilesResult,
    assignmentsResult,
    membershipsResult,
    authUsersResult,
  ] = await Promise.all([
    adminClient
      .schema("iam")
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    adminClient
      .schema("iam")
      .from("product_role_assignments")
      .select("user_id, role_key")
      .eq("product_key", "admin"),
    adminClient
      .schema("iam")
      .from("product_memberships")
      .select("user_id, status")
      .eq("product_key", "admin"),
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
      assignment.role_key as AdminRoleKey,
    ]),
  );
  const activeAdminUsers = new Set(
    (membershipsResult.data ?? [])
      .filter((membership) => membership.status === "active")
      .map((membership) => membership.user_id),
  );

  const profiles = (profilesResult.data as ProfileRow[]).map((profile) => ({
    ...profile,
    email: emailByUser.get(profile.user_id) ?? "Unknown",
    admin_role: activeAdminUsers.has(profile.user_id)
      ? (roleByUser.get(profile.user_id) ?? null)
      : null,
  }));
  const availableUsers = authUsersResult.data.users
    .filter(
      (user) =>
        Boolean(user.email) &&
        (!activeAdminUsers.has(user.id) || !roleByUser.has(user.id)),
    )
    .map((user) => ({
      id: user.id,
      email: user.email!,
      created_at: user.created_at,
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

  const assignment = await parseAssignment(request);
  if (!assignment) {
    return NextResponse.json(
      { error: "A user and valid Admin role are required." },
      { status: 400 },
    );
  }

  const result = await saveAssignment({
    actorUserId: access.user.id,
    targetUserId: assignment.userId,
    role: assignment.role,
  });
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Admin access assigned.",
  });
}

export async function PATCH(request: Request) {
  const access = await authorizeAdminCapability(ADMIN_CAPABILITIES.usersUpdate);
  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const assignment = await parseAssignment(request);
  if (!assignment) {
    return NextResponse.json(
      { error: "A user and valid Admin role are required." },
      { status: 400 },
    );
  }

  const result = await saveAssignment({
    actorUserId: access.user.id,
    targetUserId: assignment.userId,
    role: assignment.role,
  });
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true, message: "Admin access updated." });
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
      { error: "You cannot remove your own Admin access." },
      { status: 409 },
    );
  }

  const adminClient = createSupabaseServiceRoleClient();
  const { error } = await adminClient.schema("iam").rpc("revoke_admin_access", {
    p_actor_user_id: access.user.id,
    p_target_user_id: body.user_id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Admin access removed." });
}
