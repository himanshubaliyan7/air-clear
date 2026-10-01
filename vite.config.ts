// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Local development only: the API allows requests from the deployed sites, not from
// localhost. Run with DEV_API_PROXY=https://<api host> and VITE_API_BASE_URL set to the
// dev server's own address, and /api is forwarded there.
const devApiProxy = process.env["DEV_API_PROXY"];

export default defineConfig({
  ...(devApiProxy
    ? { vite: { server: { proxy: { "/api": { target: devApiProxy, changeOrigin: true } } } } }
    : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
