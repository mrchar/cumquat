import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import Vue from 'unplugin-vue/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [Vue(), tailwindcss()],
  resolve: {
    alias: [
      {
        // LiveDemo 需要运行时编译模板，统一改用含编译器的完整版构建
        find: /^vue$/,
        replacement: 'vue/dist/vue.esm-bundler.js',
      },
      {
        // 开发态直接指向组件源码，无需先构建 dist
        find: /^@cumquat\/components$/,
        replacement: fileURLToPath(new URL('../packages/components/src/index.ts', import.meta.url)),
      },
    ],
  },
});
