import type { Metadata } from "next"

import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import CustomCalculatorClient from "./client"

export const metadata: Metadata = {
  title: "Custom Calculator",
  description: "Build your own drag-and-drop calculator with custom formulas and fields.",
}

async function getTemplateAccess() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      plan: "free" as const,
      isPro: false,
      limit: 0,
    }
  }

  const access = await getWorkspaceAccessForUser(user.id)
  return {
    plan: access.plan,
    isPro: access.isPro,
    limit: access.limits.customCalculatorTemplates,
  }
}

export default async function Page() {
  const templateAccess = await getTemplateAccess()

  return <CustomCalculatorClient templateAccess={templateAccess} />
}
