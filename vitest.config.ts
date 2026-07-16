import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/{jayantgoyal,portfolio}/**/*.test.ts"],
  },
});
