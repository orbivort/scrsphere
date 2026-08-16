import path from 'path';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Dedicated Vitest config for the frontend package. Keeping the test block
// separate from vite.config.ts follows the current convention (see the
// backend and shared packages) and lets the build config stay focused.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@scrumooth/shared': path.resolve(import.meta.dirname, '../shared/dist'),
    },
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
});
