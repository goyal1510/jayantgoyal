import { NextRequest, NextResponse } from "next/server"

import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"
import {
  normalizeTemplateComponents,
  normalizeTemplateDescription,
  normalizeTemplateName,
  type CustomCalculatorTemplateAccess,
} from "@/lib/custom-calculator/templates"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function accessResponse(access: Awaited<ReturnType<typeof getWorkspaceAccessForUser>>): CustomCalculatorTemplateAccess {
  return {
    plan: access.plan,
    isPro: access.isPro,
    limit: access.limits.customCalculatorTemplates,
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const access = await getWorkspaceAccessForUser(user.id)
    const { data, error } = await supabase
      .schema("jg_app")
      .from("custom_calculator_templates")
      .select("id,name,description,components,dark_mode,created_at,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to load calculator templates." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: data ?? [],
      access: accessResponse(access),
    })
  } catch (error) {
    console.error("Error in GET /api/custom-calculator/templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const access = await getWorkspaceAccessForUser(user.id)
    if (!access.isPro) {
      return NextResponse.json(
        {
          error: "Cloud templates for the custom calculator are included with Pro.",
          code: "CUSTOM_CALCULATOR_TEMPLATES_PRO_REQUIRED",
          upgradePath: "/pricing",
          plan: access.plan,
          limit: access.limits.customCalculatorTemplates,
        },
        { status: 402 }
      )
    }

    const body = await request.json()
    const name = normalizeTemplateName(body?.name)
    const description = normalizeTemplateDescription(body?.description)
    const components = normalizeTemplateComponents(body?.components)
    const darkMode = body?.darkMode === true

    if (!name) {
      return NextResponse.json({ error: "Template name is required." }, { status: 400 })
    }
    if (!components) {
      return NextResponse.json(
        { error: "Add at least one valid calculator component before saving." },
        { status: 400 }
      )
    }

    const { count, error: countError } = await supabase
      .schema("jg_app")
      .from("custom_calculator_templates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      return NextResponse.json(
        { error: countError.message || "Unable to check template usage." },
        { status: 500 }
      )
    }

    if ((count ?? access.limits.customCalculatorTemplates) >= access.limits.customCalculatorTemplates) {
      return NextResponse.json(
        {
          error: `Pro includes ${access.limits.customCalculatorTemplates} custom calculator templates.`,
          code: "CUSTOM_CALCULATOR_TEMPLATE_LIMIT_REACHED",
          upgradePath: "/pricing",
          plan: access.plan,
          limit: access.limits.customCalculatorTemplates,
        },
        { status: 402 }
      )
    }

    const { data, error } = await supabase
      .schema("jg_app")
      .from("custom_calculator_templates")
      .insert({
        user_id: user.id,
        name,
        description,
        components,
        dark_mode: darkMode,
      })
      .select("id,name,description,components,dark_mode,created_at,updated_at")
      .single()

    if (error) {
      const status = error.code === "23505" ? 409 : 500
      return NextResponse.json(
        { error: error.code === "23505" ? "A template with this name already exists." : error.message },
        { status }
      )
    }

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/custom-calculator/templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
