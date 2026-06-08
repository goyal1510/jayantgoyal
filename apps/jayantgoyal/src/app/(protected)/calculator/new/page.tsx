import type { Metadata } from "next"

import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import NewCalculatorClient from "./client"

export const metadata: Metadata = {
  title: "New Calculation",
  description: "Cash denomination calculator — count currency notes and coins with instant totals.",
}

async function getCalculatorWorkspaceAccess() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  return getWorkspaceAccessForUser(user.id)
}

export default async function Page() {
  const workspaceAccess = await getCalculatorWorkspaceAccess()

  return <NewCalculatorClient workspaceAccess={workspaceAccess} />
}
