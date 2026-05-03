import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@aise/shared": resolve(__dirname, "packages/shared/src/index.ts"),
      "@aise/providers": resolve(__dirname, "packages/providers/src/index.ts"),
      "@aise/core": resolve(__dirname, "packages/core/src/index.ts")
    }
  },
  test: {
    include: ["packages/**/*.test.ts"],
    environment: "node",
    coverage: {
      reporter: ["text", "json", "html"]
    }
  }
});
