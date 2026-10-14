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
  optimizeDeps: {
    include: ['@shuttle-connect/types'],
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
