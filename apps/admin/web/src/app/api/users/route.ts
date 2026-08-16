import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@jayantgoyal/web-auth/service-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ProfileRow {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

// GET - Fetch all profiles with user emails
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is super_admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .schema("jg_account")
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service role to fetch user emails
    const adminClient = createSupabaseServiceRoleClient();

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await adminClient
      .schema("jg_account")
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 },
      );
    }

    // Fetch user emails from auth.users
    const { data: authUsers, error: authError } =
      await adminClient.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Map emails to profiles
    const emailMap = new Map<string, string>();
    for (const u of authUsers.users) {
      if (u.email) {
        emailMap.set(u.id, u.email);
      }
    }

    const profilesWithEmails = (profiles as ProfileRow[] | null)?.map((p) => ({
      ...p,
      email: emailMap.get(p.user_id) || "Unknown",
    }));

    // Get user IDs that already have profiles
    const existingUserIds = new Set(
      (profiles as ProfileRow[] | null)?.map((p) => p.user_id) || [],
    );

    // Get available users (those without profiles)
    const availableUsers = authUsers.users
      .filter((u) => !existingUserIds.has(u.id) && u.email)
      .map((u) => ({
        id: u.id,
        email: u.email!,
        created_at: u.created_at,
      }));

    return NextResponse.json({ profiles: profilesWithEmails, availableUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Add a new user as admin
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is super_admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .schema("jg_account")
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { error: "User and role are required" },
        { status: 400 },
      );
    }

    if (!["user", "admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Use service role
    const adminClient = createSupabaseServiceRoleClient();

    // Verify user exists
    const { data: authUser, error: authError } =
      await adminClient.auth.admin.getUserById(user_id);

    if (authError || !authUser.user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const targetUser = authUser.user;

    // Check if profile already exists
    const { data: existingProfile } = await adminClient
      .schema("jg_account")
      .from("profiles")
      .select("id, role")
      .eq("user_id", targetUser.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await adminClient
        .schema("jg_account")
        .from("profiles")
        .update({ role })
        .eq("id", (existingProfile as { id: number; role: string }).id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: `User role updated to ${role}`,
      });
    }

    // Create new profile
    const { error: insertError } = await adminClient
      .schema("jg_account")
      .from("profiles")
      .insert({ user_id: targetUser.id, role });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User added as ${role}`,
    });
  } catch (error) {
    console.error("Error adding user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
