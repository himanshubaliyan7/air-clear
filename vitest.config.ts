import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Unit tests only: pure logic modules under src/lib. No app server or browser needed.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
