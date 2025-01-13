import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^houp$/, replacement: resolve("./src/index.ts") },
      { find: /^houp(.*)$/, replacement: resolve("./src/$1.ts") },
    ],
  },
  test: {
    name: "houp-test",
    globals: true,
    environment: "jsdom",
    dir: "tests",
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    coverage: {
      include: ["src/**/"],
      exclude: ["src/shared.ts"],
      reportsDirectory: "./.coverage/",
      thresholds: {
        100: true,
      }
    },
  },
})