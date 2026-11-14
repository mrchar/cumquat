import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    dts: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    alias: [
      {
        find: /^@cumquat\/core$/,
        replacement: fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      },
    ],
  },
});
