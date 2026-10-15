import Vue from 'unplugin-vue/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [Vue()],
  test: {
    environment: 'jsdom',
  },
  run: {
    cache: true,
  },
  lint: {
    plugins: ['typescript'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
    overrides: [
      {
        files: ['**/*.spec.ts', '**/*.test.ts'],
        plugins: ['vitest'],
        rules: {
          'typescript/no-explicit-any': 'off',
        },
      },
    ],
  },
  fmt: {
    singleQuote: true,
    semi: true,
    printWidth: 100,
  },
});
