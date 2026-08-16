import type { MetadataRoute } from "next";

import { buildAppManifest } from "@jayantgoyal/web-seo";

export default function manifest(): MetadataRoute.Manifest {
  return buildAppManifest({
    appId: "auth",
    backgroundColor: "#111214",
    themeColor: "#111214",
    startUrl: "/welcome",
  });
}
