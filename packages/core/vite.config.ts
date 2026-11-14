import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    dts: true,
  },
  test: {
    environment: 'node',
  },
});
