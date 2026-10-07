import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" melempar error di luar Next.js; di test cukup modul kosong.
      "server-only": path.resolve(__dirname, "src/test/empty.ts"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
