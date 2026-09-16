import type { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  ChecklistSummary,
  DependencySummary,
  SavedViewSummary,
} from "@/lib/orbit/types";

type OrbitSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function listCardChecklists(
  supabase: OrbitSupabaseClient,
  cardId: string,
): Promise<ChecklistSummary[]> {
  const { data: checklists, error: checklistError } = await supabase
    .schema("orbit")
    .from("checklists")
    .select("id, card_id, title")
    .eq("card_id", cardId)
    .order("rank", { ascending: true });

  if (checklistError) throw checklistError;
  if (!checklists?.length) return [];

  const checklistIds = checklists.map((checklist) => checklist.id as string);
  const { data: items, error: itemError } = await supabase
    .schema("orbit")
    .from("checklist_items")
    .select("id, checklist_id, body, completed")
    .in("checklist_id", checklistIds)
    .order("rank", { ascending: true });

  if (itemError) throw itemError;

  const itemsByChecklist = new Map<string, ChecklistSummary["items"]>();
  for (const item of items ?? []) {
    const checklistId = item.checklist_id as string;
    const bucket = itemsByChecklist.get(checklistId) ?? [];
    bucket.push({
      id: item.id as string,
      body: item.body as string,
      completed: item.completed as boolean,
    });
    itemsByChecklist.set(checklistId, bucket);
  }

  return checklists.map((checklist) => ({
    id: checklist.id as string,
    cardId: checklist.card_id as string,
    title: checklist.title as string,
    items: itemsByChecklist.get(checklist.id as string) ?? [],
  }));
}

export async function listCardDependencies(
  supabase: OrbitSupabaseClient,
  cardId: string,
): Promise<DependencySummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("card_dependencies")
    .select("id, depends_on_card_id, dependency_type")
    .eq("card_id", cardId);

  if (error) throw error;

  if (!data?.length) return [];

  const dependsOnIds = data.map((row) => row.depends_on_card_id as string);
  const { data: cards, error: cardError } = await supabase
    .schema("orbit")
    .from("cards")
    .select("id, number, title, board_id")
    .in("id", dependsOnIds);

  if (cardError) throw cardError;

  const cardById = new Map(
    (cards ?? []).map((card) => [card.id as string, card]),
  );

  return data.map((row) => {
    const dependsOn = cardById.get(row.depends_on_card_id as string);
    return {
      id: row.id as string,
      dependsOnCardId: row.depends_on_card_id as string,
      dependencyType: row.dependency_type as string,
      dependsOnTitle: (dependsOn?.title as string) ?? "Card",
      dependsOnNumber: (dependsOn?.number as number) ?? 0,
    };
  });
}

export async function listBoardSavedViews(
  supabase: OrbitSupabaseClient,
  boardId: string,
  userId: string,
): Promise<SavedViewSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("saved_views")
    .select("id, name, filters, is_shared, owner_user_id")
    .eq("board_id", boardId)
    .or(`owner_user_id.eq.${userId},is_shared.eq.true`);

  if (error) throw error;

  return (data ?? []).map((view) => ({
    id: view.id as string,
    name: view.name as string,
    filters: view.filters as Record<string, unknown>,
    isShared: view.is_shared as boolean,
    isOwner: view.owner_user_id === userId,
  }));
}

export async function listBoardChecklistsByCard(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<Record<string, ChecklistSummary[]>> {
  const { data: checklists, error } = await supabase
    .schema("orbit")
    .from("checklists")
    .select("id, card_id, title")
    .eq("board_id", boardId);

  if (error) throw error;
  if (!checklists?.length) return {};

  const checklistIds = checklists.map((entry) => entry.id as string);
  const { data: items, error: itemError } = await supabase
    .schema("orbit")
    .from("checklist_items")
    .select("id, checklist_id, body, completed")
    .in("checklist_id", checklistIds);

  if (itemError) throw itemError;

  const itemsByChecklist = new Map<string, ChecklistSummary["items"]>();
  for (const item of items ?? []) {
    const checklistId = item.checklist_id as string;
    const bucket = itemsByChecklist.get(checklistId) ?? [];
    bucket.push({
      id: item.id as string,
      body: item.body as string,
      completed: item.completed as boolean,
    });
    itemsByChecklist.set(checklistId, bucket);
  }

  const grouped: Record<string, ChecklistSummary[]> = {};
  for (const checklist of checklists) {
    const cardId = checklist.card_id as string;
    grouped[cardId] ??= [];
    grouped[cardId].push({
      id: checklist.id as string,
      cardId,
      title: checklist.title as string,
      items: itemsByChecklist.get(checklist.id as string) ?? [],
    });
  }
  return grouped;
}

export async function listBoardDependenciesByCard(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<Record<string, DependencySummary[]>> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("card_dependencies")
    .select("id, card_id, depends_on_card_id, dependency_type")
    .eq("board_id", boardId);

  if (error) throw error;
  if (!data?.length) return {};

  const dependsOnIds = [...new Set(data.map((row) => row.depends_on_card_id as string))];
  const { data: cards, error: cardError } = await supabase
    .schema("orbit")
    .from("cards")
    .select("id, number, title")
    .in("id", dependsOnIds);

  if (cardError) throw cardError;
  const cardById = new Map((cards ?? []).map((card) => [card.id as string, card]));

  const grouped: Record<string, DependencySummary[]> = {};
  for (const row of data) {
    const cardId = row.card_id as string;
    const dependsOn = cardById.get(row.depends_on_card_id as string);
    grouped[cardId] ??= [];
    grouped[cardId].push({
      id: row.id as string,
      dependsOnCardId: row.depends_on_card_id as string,
      dependencyType: row.dependency_type as string,
      dependsOnTitle: (dependsOn?.title as string) ?? "Card",
      dependsOnNumber: (dependsOn?.number as number) ?? 0,
    });
  }
  return grouped;
}

export async function listWatchedCardIds(
  supabase: OrbitSupabaseClient,
  boardId: string,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("card_watches")
    .select("card_id")
    .eq("board_id", boardId)
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.card_id as string);
}

export async function isCardWatched(
  supabase: OrbitSupabaseClient,
  cardId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("card_watches")
    .select("card_id")
    .eq("card_id", cardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
