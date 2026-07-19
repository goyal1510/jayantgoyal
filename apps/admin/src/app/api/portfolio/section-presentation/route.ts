import { NextResponse } from "next/server";
import {
  PORTFOLIO_ADMIN_SELECT_COLUMNS,
  type PortfolioNavigationRecord,
  type PortfolioSectionContentRecord,
  type PortfolioSectionPresentationInput,
  validatePortfolioSectionPresentationInput,
} from "@repo/portfolio-data";

import {
  authorizeAndGetClient,
  revalidatePortfolioPublicContent,
} from "../[table]/helpers";

function invalidPayload(fields: string[]) {
  return NextResponse.json(
    { error: "Invalid section presentation payload", fields },
    { status: 400 },
  );
}

function sectionCopyForWrite(input: PortfolioSectionPresentationInput) {
  return {
    eyebrow: input.copy.eyebrow,
    headline: input.copy.headline,
    accent: input.copy.accent,
    description: input.copy.description,
    supporting_text: input.copy.supporting_text,
    is_visible: input.copy.is_visible,
  };
}

function navigationForWrite(input: PortfolioSectionPresentationInput) {
  if (!input.navigation) return null;
  return {
    section_id: input.section_key,
    label: input.navigation.label,
    note: input.navigation.note,
    sort_order: input.navigation.sort_order,
    is_visible: input.navigation.is_visible,
  };
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const validationErrors = validatePortfolioSectionPresentationInput(body);
    if (validationErrors.length > 0) return invalidPayload(validationErrors);

    const input = body as PortfolioSectionPresentationInput;
    const auth = await authorizeAndGetClient();
    if ("error" in auth) return auth.error;

    const [existingCopyResult, existingNavigationResult] = await Promise.all([
      auth.client
        .schema("portfolio")
        .from("section_content")
        .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.section_content)
        .eq("section_key", input.section_key)
        .maybeSingle(),
      auth.client
        .schema("portfolio")
        .from("nav_items")
        .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.nav_items)
        .eq("section_id", input.section_key)
        .maybeSingle(),
    ]);

    if (existingCopyResult.error || existingNavigationResult.error) {
      return NextResponse.json(
        {
          error:
            existingCopyResult.error?.message ??
            existingNavigationResult.error?.message ??
            "Unable to load section presentation",
        },
        { status: 500 },
      );
    }

    const existingCopy =
      existingCopyResult.data as unknown as PortfolioSectionContentRecord | null;
    const existingNavigation =
      existingNavigationResult.data as unknown as PortfolioNavigationRecord | null;

    const copyPayload = sectionCopyForWrite(input);
    const copyResult = existingCopy
      ? await auth.client
          .schema("portfolio")
          .from("section_content")
          .update(copyPayload)
          .eq("id", existingCopy.id)
          .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.section_content)
          .single()
      : await auth.client
          .schema("portfolio")
          .from("section_content")
          .insert({ section_key: input.section_key, ...copyPayload })
          .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.section_content)
          .single();

    if (copyResult.error || !copyResult.data) {
      return NextResponse.json(
        { error: copyResult.error?.message ?? "Unable to save section copy" },
        { status: 500 },
      );
    }

    const savedCopy =
      copyResult.data as unknown as PortfolioSectionContentRecord;

    const navigationPayload = navigationForWrite(input);
    if (navigationPayload) {
      const navigationResult = existingNavigation
        ? await auth.client
            .schema("portfolio")
            .from("nav_items")
            .update(navigationPayload)
            .eq("id", existingNavigation.id)
            .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.nav_items)
            .single()
        : await auth.client
            .schema("portfolio")
            .from("nav_items")
            .insert(navigationPayload)
            .select(PORTFOLIO_ADMIN_SELECT_COLUMNS.nav_items)
            .single();

      if (navigationResult.error || !navigationResult.data) {
        let rollbackError: string | null = null;
        const previousCopy = existingCopy;

        if (previousCopy) {
          const rollback = await auth.client
            .schema("portfolio")
            .from("section_content")
            .update({
              eyebrow: previousCopy.eyebrow,
              headline: previousCopy.headline,
              accent: previousCopy.accent,
              description: previousCopy.description,
              supporting_text: previousCopy.supporting_text,
              is_visible: previousCopy.is_visible,
            })
            .eq("id", previousCopy.id);
          rollbackError = rollback.error?.message ?? null;
        } else {
          const rollback = await auth.client
            .schema("portfolio")
            .from("section_content")
            .delete()
            .eq("id", savedCopy.id);
          rollbackError = rollback.error?.message ?? null;
        }

        const errorMessage =
          navigationResult.error?.message ?? "Unable to save navigation";
        return NextResponse.json(
          {
            error: rollbackError
              ? `${errorMessage}; copy rollback also failed: ${rollbackError}`
              : `${errorMessage}; section copy was rolled back`,
            fields: ["navigation"],
          },
          { status: 500 },
        );
      }

      revalidatePortfolioPublicContent();
      return NextResponse.json({
        data: {
          sectionContent: copyResult.data,
          navigation: navigationResult.data,
        },
      });
    }

    revalidatePortfolioPublicContent();
    return NextResponse.json({
      data: { sectionContent: copyResult.data, navigation: null },
    });
  } catch (error) {
    console.error("Error saving section presentation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
