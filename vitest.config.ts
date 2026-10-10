import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./frontend/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["backend/test/**/*.test.ts", "frontend/test/**/*.test.ts"],
  },
});
