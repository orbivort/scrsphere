import path from 'path';
import { readFileSync } from 'fs';

import { defineConfig, type Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
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

  return {
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
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@scrsphere/shared': path.resolve(__dirname, '../shared/dist'),
      },
    },
    server: {
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
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')
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
      ],
      testTimeout: 30000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/setupTests.ts',
          'src/test-utils.tsx',
          'src/__mocks__/',
          'src/services/mockApi.ts',
          'src/services/mockData.ts',
        ],
        all: true,
        thresholds: {
          lines: 75,
          functions: 75,
          branches: 70,
          statements: 75,
        },
      },
    },
  };
});
