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
    alias: [
      {
        // LiveDemo 运行时编译模板需要含编译器的完整版构建（仅测试环境）
        find: /^vue$/,
        replacement: 'vue/dist/vue.esm-bundler.js',
      },
    ],
  },
});
