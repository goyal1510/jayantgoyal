import type { MetadataRoute } from "next";

import { buildAppManifest } from "@jayantgoyal/web-seo";

export default function manifest(): MetadataRoute.Manifest {
  return buildAppManifest({
    appId: "portfolio",
    backgroundColor: "#f3f0e8",
    themeColor: "#f3f0e8",
  });
}
