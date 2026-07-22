import type { Metadata } from "next";

import { buildToolPageMetadata } from "@/lib/tools/metadata";

import MediaConverterClient from "./client";

const pathname = "/tools/media-qr/media-converter";

export const metadata: Metadata = buildToolPageMetadata(pathname);

export default function MediaConverterPage() {
  return <MediaConverterClient />;
}
