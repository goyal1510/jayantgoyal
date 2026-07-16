import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/{portfolio,studio}/**/*.test.ts"],
  },
});
