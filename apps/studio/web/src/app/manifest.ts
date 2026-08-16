import type { MetadataRoute } from "next";

import { buildAppManifest } from "@jayantgoyal/web-seo";

export default function manifest(): MetadataRoute.Manifest {
  return buildAppManifest({
    appId: "studio",
    backgroundColor: "#0a0a0a",
    themeColor: "#0a0a0a",
  });
}
