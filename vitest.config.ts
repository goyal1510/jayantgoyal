import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/studio/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "apps/{admin,auth,portfolio,studio}/**/*.test.ts",
      "packages/{auth,brand,platform,seo,ui}/**/*.test.ts",
    ],
  },
});
