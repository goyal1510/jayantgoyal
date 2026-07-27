import type { Metadata } from "next";

import { StudioInventory } from "@/components/studio/studio-inventory";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_METADATA,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo/config";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: DEFAULT_OG_IMAGE_METADATA.width,
        height: DEFAULT_OG_IMAGE_METADATA.height,
        alt: DEFAULT_OG_IMAGE_METADATA.alt,
        type: DEFAULT_OG_IMAGE_METADATA.type,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function Page() {
  return <StudioInventory />;
}
