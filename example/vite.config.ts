import { defineConfig } from 'vite';
import Vue from 'unplugin-vue/vite';

export default defineConfig({
  plugins: [Vue()],
  optimizeDeps: {
    // 多入口子路径须纳入同一次预构建，否则模块级单例（如 message 队列）会被拆分
    include: ['@mrchar/cumquat', '@mrchar/cumquat/composables', '@mrchar/cumquat/components'],
  },
});
