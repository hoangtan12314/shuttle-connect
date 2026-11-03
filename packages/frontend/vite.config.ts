/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must come before @vitejs/plugin-react -- it generates the route tree, react then compiles.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // @shuttle-connect/types is a symlinked workspace package shipping CommonJS (required by
  // server/esbuild, see CLAUDE.md). Vite skips its usual CJS->ESM pre-bundling for symlinked
  // deps by default, so force it through here -- otherwise named imports fail at runtime.
  //
  // `force: true` re-runs that pre-bundling on every dev server start, instead of trusting
  // Vite's on-disk cache (node_modules/.vite/deps). Vite's cache-invalidation heuristics don't
  // reliably notice when this *local* package's dist/ output changes underneath it (no lockfile
  // or package.json version bump happens on a workspace rebuild), so without this the cache goes
  // stale every time packages/types changes -- "does not provide an export named 'X'" for an
  // export that genuinely exists in the rebuilt dist/. The cost is a slightly slower dev-server
  // cold start every time, in exchange for never hitting that error again.
  optimizeDeps: {
    include: ['@shuttle-connect/types'],
    force: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // No tests exist yet (this is a fresh FSD scaffold) -- don't fail CI/lint-staged over that;
    // remove this once the first test file lands.
    passWithNoTests: true,
  },
});
