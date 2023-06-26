/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: 'verbose',
    globals: true,
    coverage: {
      all: true,
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.{test,spec}.ts', '**/*.d.ts'],
    },
  },
});
