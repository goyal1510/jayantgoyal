import type { CommerceEntitlement } from "@/lib/commerce/types"
import { listActiveEntitlementsForUser } from "@/lib/commerce/database.server"

export const COMMERCE_FEATURE_KEYS = {
  workspacePro: "workspace_pro",
} as const

export const WORKSPACE_PLAN_LIMITS = {
  free: {
    fileStorageBytes: 50 * 1024 * 1024,
    singleUploadBytes: 25 * 1024 * 1024,
    savedCalculations: 25,
    customCalculatorTemplates: 0,
    toolSavedItems: 5,
    toolBulkItems: 3,
  },
  pro: {
    fileStorageBytes: 1024 * 1024 * 1024,
    singleUploadBytes: 25 * 1024 * 1024,
    savedCalculations: 1000,
    customCalculatorTemplates: 50,
    toolSavedItems: 200,
    toolBulkItems: 100,
  },
} as const

export type WorkspacePlan = keyof typeof WORKSPACE_PLAN_LIMITS

export interface WorkspaceAccess {
  plan: WorkspacePlan
  isPro: boolean
  entitlements: CommerceEntitlement[]
  featureKeys: string[]
  limits: (typeof WORKSPACE_PLAN_LIMITS)[WorkspacePlan]
}

export function deriveWorkspaceAccess(entitlements: CommerceEntitlement[]): WorkspaceAccess {
  const featureKeys = entitlements.map((entitlement) => entitlement.feature_key)
  const isPro =
    featureKeys.includes(COMMERCE_FEATURE_KEYS.workspacePro) ||
    featureKeys.some((featureKey) => featureKey.startsWith("product:"))
  const plan: WorkspacePlan = isPro ? "pro" : "free"

  return {
    plan,
    isPro,
    entitlements,
    featureKeys,
    limits: WORKSPACE_PLAN_LIMITS[plan],
  }
}

export async function getWorkspaceAccessForUser(userId: string) {
  const entitlements = await listActiveEntitlementsForUser(userId)
  return deriveWorkspaceAccess(entitlements)
}
