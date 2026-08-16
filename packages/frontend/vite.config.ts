import path from 'path';
import { readFileSync } from 'fs';

import { defineConfig, type Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf-8')
);

// Simple plugin to replace version placeholder in HTML
const htmlVersionPlugin = (): Plugin => ({
  name: 'html-version',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace(/%__APP_VERSION__%/g, rootPackageJson.version);
    },
  },
});

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  // Read configuration from environment variables with defaults
  const port = parseInt(env.VITE_DEV_PORT || '5173', 10);
  const apiUrl = env.VITE_API_URL || 'http://localhost:5001/api/v1';

  // Extract base URL for proxy (remove /api/v1 suffix if present)
  const proxyTarget = apiUrl.replace(/\/api\/v1\/?$/, '');

  // Base path for GitHub Pages deployment
  // For username.github.io, base is '/'
  // For username.github.io/repo-name, set VITE_BASE_PATH='/repo-name/'
  const base = env.VITE_BASE_PATH || '/';

  // Source maps expose source code. Emit them only for development builds;
  // keep production bundles free of .map files to avoid source-code leakage
  // and reduce image size. Checking the Vite mode is the canonical way: the
  // default `vite build` mode is "production" (no source maps), while
  // `vite build --mode development` and `vite dev` emit them.
  const isDev = mode === 'development';

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(rootPackageJson.version),
    },
    plugins: [
      htmlVersionPlugin(),
      react(),
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
    ],
    // Relocate Vite's dependency cache out of the default node_modules/.vite.
    // In the dev container node_modules is root-owned (read-only to the non-root
    // user), so VITE_CACHE_DIR points at a writable directory. Falls back to the
    // Vite default for local (non-container) development.
    cacheDir: env.VITE_CACHE_DIR || 'node_modules/.vite',
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        '@scrumooth/shared': path.resolve(import.meta.dirname, '../shared/dist'),
      },
    },
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: isDev,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/@tanstack/react-query/')) {
              return 'vendor-query';
            }
            if (
              id.includes('node_modules/chart.js/') ||
              id.includes('node_modules/react-chartjs-2/')
            ) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/date-fns/') || id.includes('node_modules/zustand/')) {
              return 'vendor-utils';
            }
            if (id.includes('node_modules/axios/')) {
              return 'vendor-http';
            }
            if (
              id.includes('node_modules/react-markdown/') ||
              id.includes('node_modules/remark-gfm/') ||
              id.includes('node_modules/rehype-sanitize/')
            ) {
              return 'vendor-markdown';
            }
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      globalSetup: ['./src/globalSetup.ts'],
      setupFiles: ['./src/setupTests.ts'],
      env: {
        VITE_LOG_LEVEL: 'debug',
      },
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        'coverage',
        'e2e',
        'playwright-report',
        'test-results',
        'src/__mocks__/',
        'src/**/*.scenarios.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/*.css',
        '**/*.module.css',
      ],
      testTimeout: 30000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/',
          'src/setupTests.ts',
          'src/test-utils.tsx',
          'src/__mocks__/',
          'src/services/mockApi.ts',
          'src/services/mockData.ts',
          'src/services/mockSmDashboard.service.ts',
          'src/services/mockSmDashboardData.ts',
          'src/services/mockDataUtils.ts',
          'src/services/mockErrorSimulation.ts',
          'src/services/mockResponseUtils.ts',
          'src/i18n/testConfig.ts',
          'src/test-utils/i18nHelpers.ts',
          '**/*.css',
          '**/*.module.css',
        ],
        all: true,
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  };
});
