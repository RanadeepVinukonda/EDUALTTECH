import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Backend source uses NodeNext-style `./foo.js` specifiers that actually live in
 * `./foo.ts`. Vite can't resolve those, so rewrite relative `.js` imports to `.ts`.
 */
function jsToTs(): Plugin {
  return {
    name: "js-to-ts",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !source.startsWith(".") || !source.endsWith(".js")) return null;
      const cleanImporter = importer.split("?")[0];
      const candidate = path.resolve(path.dirname(cleanImporter), source.slice(0, -3) + ".ts");
      return existsSync(candidate) ? candidate : null;
    },
  };
}

export default defineConfig({
  plugins: [jsToTs()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./frontend/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["backend/test/setup-env.ts"],
    include: ["backend/test/**/*.test.ts", "frontend/test/**/*.test.ts"],
  },
});
