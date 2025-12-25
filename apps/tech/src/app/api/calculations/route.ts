import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const pageParam = Number(url.searchParams.get("page")) || 1
    const pageSizeParam = Number(url.searchParams.get("pageSize")) || 10
    const searchParam = url.searchParams.get("search")?.trim() ?? ""
    const dateParam = url.searchParams.get("date")?.trim() ?? ""
    const isDatePattern = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    const parsedDate =
      dateParam && isDatePattern ? new Date(`${dateParam}T00:00:00.000Z`) : null
    const isDateValid = Boolean(parsedDate && !Number.isNaN(parsedDate.getTime()))
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const pageSize =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0
        ? Math.min(pageSizeParam, 50)
        : 10

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const buildFilteredQuery = (columns: string, withCount = false) => {
      let scoped = supabase
        .schema("currency_calculator")
        .from("calculations")
        .select(columns, withCount ? { count: "exact" } : undefined)
        .eq("user_id", user.id)

      if (searchParam) {
        const term = `%${searchParam}%`
        scoped = scoped.ilike("note", term)
      }
      if (isDateValid && parsedDate) {
        const endDate = new Date(parsedDate)
        endDate.setUTCHours(23, 59, 59, 999)
        scoped = scoped
          .gte("created_at", parsedDate.toISOString())
          .lte("created_at", endDate.toISOString())
      }
      return scoped
    }

    const listQuery = buildFilteredQuery("*, id", true)
    const { data: calculations, error: calcError, count } = await listQuery
      .order("created_at", { ascending: false })
      .range(from, to)

    if (calcError || !calculations || !Array.isArray(calculations)) {
      return NextResponse.json(
        { error: calcError?.message || "Unable to fetch calculations." },
        { status: 500 }
      )
    }

    type CalculationRow = {
      id: string
      created_at: string | null
      note: string | null
      ist_timestamp: string | null
      user_id: string | null
    }

    const normalizeCalculation = (calc: unknown): CalculationRow | null => {
      if (!calc || typeof calc !== "object" || typeof (calc as { id?: unknown }).id !== "string") {
        return null
      }

      const candidate = calc as Record<string, unknown>

      return {
        id: candidate.id as string,
        created_at: typeof candidate.created_at === "string" ? candidate.created_at : null,
        note: typeof candidate.note === "string" ? candidate.note : null,
        ist_timestamp:
          typeof candidate.ist_timestamp === "string" ? candidate.ist_timestamp : null,
        user_id: typeof candidate.user_id === "string" ? candidate.user_id : null,
      }
    }

    const calculationsTyped: CalculationRow[] = calculations
      .map((calc) => normalizeCalculation(calc))
      .filter((calc): calc is CalculationRow => calc !== null)

    const calculationIds = calculationsTyped.map((calc) => calc.id)
    const { data: denominations, error: denomError } = calculationIds.length
      ? await supabase
          .schema("currency_calculator")
          .from("denominations")
          .select("*")
          .in("calculation_id", calculationIds)
          .order("denomination", { ascending: false })
      : { data: [], error: null }

    if (denomError) {
      console.error("Error fetching denominations:", denomError)
      return NextResponse.json(
        { error: denomError.message || "Unable to fetch denominations." },
        { status: 500 }
      )
    }

    type DenominationRow = {
      id: string
      calculation_id: string | null
      denomination: number
      count: number
      bundle_count: number | null
      open_count: number | null
      total: number | null
    }

    const normalizeDenom = (denom: unknown): DenominationRow | null => {
      if (!denom || typeof denom !== "object") return null
      const candidate = denom as Record<string, unknown>
      if (typeof candidate.id !== "string") return null
      return {
        id: candidate.id,
        calculation_id:
          typeof candidate.calculation_id === "string" ? candidate.calculation_id : null,
        denomination:
          typeof candidate.denomination === "number" ? candidate.denomination : Number(candidate.denomination ?? 0),
        count: typeof candidate.count === "number" ? candidate.count : Number(candidate.count ?? 0),
        bundle_count:
          typeof candidate.bundle_count === "number" ? candidate.bundle_count : null,
        open_count: typeof candidate.open_count === "number" ? candidate.open_count : null,
        total: typeof candidate.total === "number" ? candidate.total : null,
      }
    }

    const denomMap = new Map<string, DenominationRow[]>()
    const denomRows = Array.isArray(denominations)
      ? (denominations as unknown[])
          .map((denom) => normalizeDenom(denom))
          .filter((denom): denom is DenominationRow => denom !== null)
      : []
    denomRows.forEach((denom) => {
      if (!denom.calculation_id) return
      const list = denomMap.get(denom.calculation_id) ?? []
      list.push(denom)
      denomMap.set(denom.calculation_id, list)
    })

    const calculationsWithDenominations = calculationsTyped.map((calc) => ({
      ...calc,
      denominations: denomMap.get(calc.id) ?? [],
    }))

    const dateQuery = buildFilteredQuery("created_at")
    const { data: dateRows, error: dateError } = await dateQuery
      .order("created_at", { ascending: false })
      .range(0, 499) // cap date scan to 500 rows for safety

    if (dateError) {
      console.error("Error fetching available dates:", dateError)
      return NextResponse.json(
        { error: dateError.message || "Unable to fetch available dates." },
        { status: 500 }
      )
    }

    const availableDateSet = new Set<string>()
    const safeDateRows = Array.isArray(dateRows) ? dateRows : []
    safeDateRows.forEach((row) => {
      if (!row || typeof row !== "object") return
      const createdAt = (row as Record<string, unknown>).created_at
      if (typeof createdAt !== "string") return
      const date = new Date(createdAt)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`
      availableDateSet.add(key)
    })

    const total = count ?? calculations.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return NextResponse.json({
      items: calculationsWithDenominations,
      total,
      page,
      pageSize,
      totalPages,
      availableDates: Array.from(availableDateSet).sort((a, b) => (a < b ? 1 : -1)),
    })
  } catch (error) {
    console.error("Error in GET /api/calculations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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

    const body = await request.json()
    const { note, ist_timestamp, denominations } = body ?? {}

    const { data: calculation, error: calcError } = await supabase
      .schema("currency_calculator")
      .from("calculations")
      .insert({
        note: note || null,
        ist_timestamp: ist_timestamp || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (calcError || !calculation) {
      return NextResponse.json(
        { error: calcError?.message || "Unable to create calculation." },
        { status: 500 }
      )
    }

    type IncomingDenom = {
      denomination: number
      count: number
      bundle_count?: number
      open_count?: number
    }

    const denominationsToInsert =
      Array.isArray(denominations) && denominations.length
        ? (denominations as IncomingDenom[]).map((denom) => ({
            calculation_id: calculation.id,
            denomination: denom.denomination,
            count: denom.count,
            bundle_count: denom.bundle_count || 0,
            open_count: denom.open_count || 0,
            total: denom.denomination * denom.count,
          }))
        : []

    const { data: createdDenominations, error: denomError } = await supabase
      .schema("currency_calculator")
      .from("denominations")
      .insert(denominationsToInsert)
      .select()

    if (denomError) {
      return NextResponse.json(
        { error: denomError.message || "Unable to save denominations." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...calculation,
      denominations: createdDenominations || [],
    })
  } catch (error) {
    console.error("Error in POST /api/calculations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
