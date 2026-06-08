import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  getMessengerDisplayName,
  type MessengerProfile,
} from "@/lib/messenger/server"

interface ContactProfile extends MessengerProfile {
  email?: string | null
}

function cleanSearchQuery(value: string | null) {
  return (value ?? "").replace(/[%_]/g, "").trim().slice(0, 80)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const query = cleanSearchQuery(request.nextUrl.searchParams.get("q"))
    const emailsByUserId = new Map<string, string>()
    const emailMatchedUserIds = new Set<string>()

    if (query) {
      const { data: userPage, error: usersError } =
        await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        })

      if (usersError) {
        return NextResponse.json(
          { error: usersError.message || "Unable to search contacts" },
          { status: 500 }
        )
      }

      for (const authUser of userPage.users) {
        const email = authUser.email ?? ""
        if (email) {
          emailsByUserId.set(authUser.id, email)
        }

        if (email.toLowerCase().includes(query.toLowerCase())) {
          emailMatchedUserIds.add(authUser.id)
        }
      }
    }

    let profileQuery = admin
      .schema("jg_account")
      .from("profiles")
      .select("user_id, first_name, last_name, avatar_url")
      .order("updated_at", { ascending: false })
      .limit(25)

    if (query) {
      profileQuery = profileQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%`
      )
    }

    const { data, error } = await profileQuery

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to search contacts" },
        { status: 500 }
      )
    }

    const profilesByUserId = new Map<string, ContactProfile>()
    for (const profile of (data ?? []) as MessengerProfile[]) {
      profilesByUserId.set(profile.user_id, {
        ...profile,
        email: emailsByUserId.get(profile.user_id) ?? null,
      })
    }

    const missingEmailMatchedUserIds = Array.from(emailMatchedUserIds).filter(
      (userId) => !profilesByUserId.has(userId)
    )

    if (missingEmailMatchedUserIds.length > 0) {
      const { data: emailMatchedProfiles, error: emailProfilesError } =
        await admin
          .schema("jg_account")
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", missingEmailMatchedUserIds)

      if (emailProfilesError) {
        return NextResponse.json(
          { error: emailProfilesError.message || "Unable to search contacts" },
          { status: 500 }
        )
      }

      for (const profile of (emailMatchedProfiles ?? []) as MessengerProfile[]) {
        profilesByUserId.set(profile.user_id, {
          ...profile,
          email: emailsByUserId.get(profile.user_id) ?? null,
        })
      }
    }

    const profiles = Array.from(profilesByUserId.values())
    const currentUserProfile = profiles.find(
      (profile) => profile.user_id === user.id
    )
    const otherProfiles = profiles.filter((profile) => profile.user_id !== user.id)
    const orderedProfiles = currentUserProfile
      ? [currentUserProfile, ...otherProfiles]
      : profiles

    const contacts = orderedProfiles.map((profile) => ({
      user_id: profile.user_id,
      display_name: getMessengerDisplayName(profile, profile.user_id, user.id),
      email: profile.email ?? null,
      avatar_url: profile.avatar_url,
      is_self: profile.user_id === user.id,
    }))

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("Error in GET /api/messenger/contacts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
