export const PORTFOLIO_ASSET_BUCKET = "portfolio-assets";
export const PORTFOLIO_ASSET_MAX_BYTES = 15 * 1024 * 1024;

export type PortfolioAssetKind =
  | "project-image"
  | "certificate-document"
  | "certificate-preview"
  | "blog-cover"
  | "resume";

const MIME_TYPES: Record<PortfolioAssetKind, readonly string[]> = {
  "project-image": ["image/png", "image/jpeg", "image/webp"],
  "certificate-document": ["application/pdf"],
  "certificate-preview": ["image/png", "image/jpeg", "image/webp"],
  "blog-cover": ["image/png", "image/jpeg", "image/webp"],
  resume: ["application/pdf"],
};

export const PORTFOLIO_ASSET_ACCEPT: Record<PortfolioAssetKind, string> = {
  "project-image": "image/png,image/jpeg,image/webp",
  "certificate-document": "application/pdf",
  "certificate-preview": "image/png,image/jpeg,image/webp",
  "blog-cover": "image/png,image/jpeg,image/webp",
  resume: "application/pdf",
};

export const PORTFOLIO_ASSET_FOLDER: Record<PortfolioAssetKind, string> = {
  "project-image": "projects",
  "certificate-document": "certificates/documents",
  "certificate-preview": "certificates/previews",
  "blog-cover": "blog",
  resume: "resume",
};

export function validatePortfolioAssetMetadata(
  kind: PortfolioAssetKind,
  file: { type: string; size: number },
): string | null {
  if (!MIME_TYPES[kind].includes(file.type)) {
    return `Unsupported file type. Allowed: ${MIME_TYPES[kind].join(", ")}`;
  }
  if (file.size <= 0) return "The selected file is empty.";
  if (file.size > PORTFOLIO_ASSET_MAX_BYTES) {
    return "The selected file exceeds the 15 MB limit.";
  }
  return null;
}

export function portfolioAssetExtension(mimeType: string): string {
  const extensionByMime: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByMime[mimeType];
  if (!extension) throw new Error(`Unsupported asset MIME type: ${mimeType}`);
  return extension;
}
