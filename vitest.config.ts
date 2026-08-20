import { defineConfig, defineProject } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/*/web/vitest.config.ts",
      defineProject({
        test: {
          name: "shared-packages-and-product-contracts",
          environment: "node",
          include: [
            "packages/*/*/src/**/*.test.ts",
            "apps/*/contracts/src/**/*.test.ts",
            "scripts/**/*.test.mjs",
          ],
        },
      }),
    ],
  },
});
