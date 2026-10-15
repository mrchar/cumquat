import { defineConfig } from 'vite-plus';
import Vue from 'unplugin-vue/rolldown';
import VueVite from 'unplugin-vue/vite';

export default defineConfig({
  plugins: [VueVite()],
  pack: {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    dts: { vue: true },
    plugins: [Vue({ isProduction: true })],
  },
  test: {
    environment: 'jsdom',
  },
});
