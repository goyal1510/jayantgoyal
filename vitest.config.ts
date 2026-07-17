import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "apps/{admin,portfolio,studio}/**/*.test.ts",
      "packages/{brand,platform,seo,ui}/**/*.test.ts",
    ],
  },
});
