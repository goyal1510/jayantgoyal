import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { authorizeAndGetClient } from "@/app/api/portfolio/[table]/helpers";
import { ADMIN_CAPABILITIES } from "@/lib/access";
import {
  PORTFOLIO_ASSET_BUCKET,
  PORTFOLIO_ASSET_FOLDER,
  portfolioAssetExtension,
  type PortfolioAssetKind,
  validatePortfolioAssetMetadata,
} from "@/lib/portfolio-assets";

const ASSET_KINDS = new Set<PortfolioAssetKind>([
  "work-image",
  "certificate-document",
  "certificate-preview",
  "writing-cover",
  "resume",
]);

function isAssetKind(
  value: FormDataEntryValue | null,
): value is PortfolioAssetKind {
  return (
    typeof value === "string" && ASSET_KINDS.has(value as PortfolioAssetKind)
  );
}

export async function POST(request: Request) {
  const auth = await authorizeAndGetClient(ADMIN_CAPABILITIES.portfolioCreate);
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File) || !isAssetKind(kind)) {
    return NextResponse.json(
      { error: "A valid file and asset kind are required." },
      { status: 400 },
    );
  }

  const validationError = validatePortfolioAssetMetadata(kind, file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const extension = portfolioAssetExtension(file.type);
  const path = `${PORTFOLIO_ASSET_FOLDER[kind]}/${Date.now()}-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await auth.client.storage
    .from(PORTFOLIO_ASSET_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = auth.client.storage
    .from(PORTFOLIO_ASSET_BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({ data: { path, url: data.publicUrl } });
}
