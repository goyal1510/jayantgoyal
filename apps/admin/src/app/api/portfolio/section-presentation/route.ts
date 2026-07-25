import { NextResponse } from "next/server";
import {
  type PortfolioSectionPresentationInput,
  type PortfolioSectionPresentationResponse,
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

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const validationErrors = validatePortfolioSectionPresentationInput(body);
    if (validationErrors.length > 0) return invalidPayload(validationErrors);

    const input = body as PortfolioSectionPresentationInput;
    const auth = await authorizeAndGetClient();
    if ("error" in auth) return auth.error;

    const { data, error } = await auth.client
      .schema("portfolio")
      .rpc("save_section_presentation", {
        p_section_key: input.section_key,
        p_copy: input.copy,
        p_navigation: input.navigation,
      });

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to save section presentation" },
        { status: 500 },
      );
    }

    revalidatePortfolioPublicContent();
    return NextResponse.json({
      data: data as unknown as PortfolioSectionPresentationResponse,
    });
  } catch (error) {
    console.error("Error saving section presentation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
