import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib/portfolio-admin-data": fileURLToPath(
        new URL("./apps/admin/src/lib/portfolio-admin-data.ts", import.meta.url),
      ),
      "@/lib/supabase/server": fileURLToPath(
        new URL("./apps/admin/src/lib/supabase/server.ts", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./apps/studio/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "apps/{admin,auth,portfolio,studio}/**/*.test.ts",
      "packages/{auth,brand,github,platform,portfolio-data,seo,ui}/**/*.test.ts",
    ],
  },
});
